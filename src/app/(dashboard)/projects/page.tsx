"use client";

//landing page for user after authentication
import React from 'react'

import {useEffect, useState} from "react"; 
import {useAuth} from "@clerk/nextjs"; //this hook is going to give access to JWT token 
import { useRouter } from 'next/navigation'; //this hook to navigate for rediretion eg from /projects to /projects/id

//import the existing UI components under app/components folder
import { ProjectsGrid } from '@/components/projects/ProjectsGrid'; //this is to list projects
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'; // to display the loading 

// add toast component in layout.tsx file
import toast from "react-hot-toast"; //toast is a small popup notification - like "project created sucessfully"
// import the helper file
import { apiClient } from '@/lib/api';
import { projectHmrIdentifiersSubscribe } from 'next/dist/build/swc/generated-native';

interface Project{
  id: string;
  name: string;
  description: string;
  created_at: string;
  clerk_id: string;
}

function ProjectsPage() {
   // define state variable
  // Data State - what we are workin with
    const [projects, setProjects] = useState<Project[]>([]);
    // setup for a loading spinner
    const [loading, setLoading] = useState(true);
    // error view state
    const [error, setError] = useState(null);
  
  // UI state - how the page looks
    // search projects 
    const [searchQuery, setSearchQuery] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  
  // Modal state - for small popup
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const {getToken, userId} = useAuth();
    const router = useRouter();
  
  // Businness logic functions- these are the actions that the page can perform
    // load projects
    const loadProjects = async() => {   // fetch projects from the backend API
      try {
          setLoading(true); //set this to TRUE before making the API call

          //get access to the JWT token
          const token = await getToken();

          // setup the API call
          const result = await apiClient.get("/api/projects", token); //apiClient custom API helper file

          const {data} = result || {};

          console.log(data, "projectList")

          setProjects(data);
      }

      catch (err){
         console.error("Error loading projects", err);
         toast.error("Failed to create a project");
      } finally {
        setLoading(false);
      }

    }; 
    // create projects
    const handleCreateProject = async (name: string, description: string) => {
      try{
         // clear( out any errors in past
         setError(null)
         setIsCreating(true)

          //get access to the JWT token
          const token = await getToken();

          // setup the API call
          const result = await apiClient.post("/api/projects",{
            name,
            description,
          },token); //apiClient custom API helper file         
          
          const savedProject = result?.data || {}
          setProjects((prev)=> [savedProject, ...prev])

          setShowCreateModal(false)
          toast.success("Project created successfully")
      }
      catch (err){
        toast.error("Failed to create project")
        console.error("Failed to create project", err)
      }
      finally{
        setIsCreating(false)
      }
    }; //sends new project data to API 
    const handleDeleteProject = async (projectId: string) => {
      try{
        setError(null)
        //get access to the JWT token
        const token = await getToken();
        const result = await apiClient.delete(`/api/projects/${projectId}`, token);

        //remove the delete project from the list
        setProjects((prev) => prev.filter((project)=> project.id !== projectId));

        toast.success("Project deleted successfully")
      }
      catch (err){
        toast.error("Failed to delete project")
        console.error("Failed to delete project", err)
      }
 
    }; // delete a project by its ID
    const handleProjectClick = async(projectId: string) => {
      router.push(`/projects/${projectId}`) // redirect to the project page
    }
    // events for modal
    const handleOpenModal = () => {
      setShowCreateModal(true);
    }

    const handleCloseModal = () => {
      setShowCreateModal(false);
    }

    useEffect(() => {
      if (userId){
        loadProjects();
      }       
    }, [userId]);
   
    const filteredProjects = projects.filter((project)=> project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  project.description.toLowerCase().includes(searchQuery.toLowerCase())                        
  );
    
    if(loading){
      return <LoadingSpinner message="Loading projects..."/>
    }
  return (
  <div>
    <ProjectsGrid 
       projects={filteredProjects}
       loading={loading}
       error = {error}
       searchQuery={searchQuery}
       onSearchChange={setSearchQuery}
       viewMode={viewMode}
       onViewModeChange={setViewMode}
       onProjectClick={handleProjectClick}
       onCreateProject={handleOpenModal}
       onDeleteProject={handleDeleteProject}
    />
    <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onCreateProject={handleCreateProject}
        isLoading={isCreating}    
    />
  </div>
  );
}

export default ProjectsPage