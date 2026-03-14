"use client";
import React, {use, useEffect, useState} from 'react';
import { ConversationsList } from '@/components/projects/ConversationsList';
import { KnowledgeBaseSidebar } from '@/components/projects/KnowledgeBaseSidebar';
import { FileDetailsModal } from '@/components/projects/FileDetailsModal';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NotFound } from '@/components/ui/NotFound';
import toast from 'react-hot-toast';
import { Project, Chat, ProjectDocument, ProjectSettings } from '@/lib/types';

//think of this as a pydantic model
interface ProjectPageProps {
    params: Promise<{
        projectId: string
    }>;
}

interface ProjectData{
    project: Project | null;
    chats: Chat[];
    documents: ProjectDocument[];
    settings: ProjectSettings | null;
}
// this is the blueprint of the page and this is the main function
   // params is the information extracted from the URL
function ProjectPage({params}:ProjectPageProps) {
    const {projectId} = use(params); //unwrap the param promise and use() is hook used to unwrap the params
    const {getToken, userId} = useAuth(); //get the token

    // we need all 4 APIs to appear all at once once we open the project id page
    const [data, setData] = useState<ProjectData>({     // here data is current state and setData is function to update the state
        project: null,
        chats: [],
        documents: [],
        settings: null
    })

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null >(null);
    //define the state for chat
    const[isCreatingChat, setisCreatingChat] = useState(false);


    // UI states
    // right side having 2 tabs 1 for document upload and other for project settings
    const [activeTab, setActiveTab] = useState<"documents" | "settings">("documents"); 

    // To keep track of what document is selected
    const [selectedDocumentId, setselectedDocumentId] = useState<string | null>(null);

    // load all data 
    useEffect(() => {
        const loadAllData = async () => {
            if (!userId)
                return // exit out of this
            try{
                setLoading(true);
                setError(null);
                const token = await getToken()
                // to make parallel api call use promise.all()
                const [projectRes, chatsRes, settingsRes, documentsRes]= await Promise.all([
                    apiClient.get(`/api/projects/${projectId}`, token),
                    apiClient.get(`/api/projects/${projectId}/chats`, token),
                    apiClient.get(`/api/projects/${projectId}/project_settings`, token),
                    apiClient.get(`/api/projects/${projectId}/files`, token),
                ]);

                setData({
                    project: projectRes.data,
                    chats: chatsRes.data,
                    documents: documentsRes.data,
                    settings: settingsRes.data
            });
            }catch(err){
               setError("Failed to fetch data");
               toast.error("Failed to fetch data");
            }finally{
                setLoading(false);
            }
        }
        loadAllData()
    }, [userId, projectId]) // depends on this
    
 
    // define methods for handling the chats

    const handleCreateNewChat = async () => {
        // here we define the API call to the backend
       if(!userId) return; //check from the auth function the user is logged in else return

       try{
        setisCreatingChat(true); //we set the loading state to true when create chat API is called
        const token = await getToken() // get the auth token
        const chatNumber = Date.now() % 10000 // generate random chat number 
        const result = await apiClient.post(`/api/projects/${projectId}/chats`, {
            title: `Chat #${chatNumber}`,
            project_id: projectId
        },token)

        const savedChat = result.data
        setData((prev) => ({ // get prev state of the object
            ...prev, //here the prject, chat, settings are retained
            chats: [savedChat, ...prev.chats] // we will only update the chat state

        }))
        toast.success("Chat created successfully")
       } catch(err){
        toast.error("Failed to create chat")
       }finally{
        setisCreatingChat(false);
       }
    };
   
    const handleDeleteChat = async (chatId: string) => {
        if(!userId) return;

        try{
            const token = await getToken()
            await apiClient.delete(`/api/projects/${projectId}/chats/${chatId}`, token)

            //update local state to remove the deleted chatid in the current local state
            setData((prev)=>({
                ...prev,
                chats: prev.chats.filter((chat) => chat.id !== chatId)
            }))

            toast.success("Chat deleted successfully")
        } catch(err){
            toast.error("Failed to delete chat")
        }
    };

    // when user click on a chat it should redirect to chat page
    const handleChatClick = (chatId: string) => {
        console.log("Navigate to chat:", chatId)
    };
    
    // document methods
    // document upload method files 
    const handleDocumentUpload = async(files: File[]) => {
        console.log("Upload files", files)
    };
    // delete the document
    const handleDocumentDelete = async(documentId: string) => {
        console.log("Document deleted", documentId)
    };
    // provide url for upload
    const handleUrlAdd = async (url: string) => {
        console.log("Add URL", url);
    }
    // top view a document
    const handleOpenDocument = (documentId: string) => {
        console.log("Open document", documentId);
        setselectedDocumentId(documentId);
    }

    // project setting method
    // handle draft settings
    const handleDraftSettings = (updates: any) => {
        console.log("Update local settings", updates);
    }

    const handlePublishSettings = async() => {
        console.log("Make API call to publish settings ");
    }

    const selectedDocument = selectedDocumentId ? data.documents.find((doc ) => doc.id == selectedDocumentId) : null;

    if (loading){
        return <LoadingSpinner message="Loading project..." />
    }

    if (!data.project){
        return <NotFound message="Project not found"/>
    }
  return (
    <>
        <div>
        <div className="flex h-screen bg-[#0d1117] gap-4 p-4">
        <ConversationsList
            project={data.project} 
            conversations={data.chats}
            error={error}
            loading={isCreatingChat}
            onCreateNewChat={handleCreateNewChat}
            onChatClick={handleChatClick}
           onDeleteChat={handleDeleteChat}       
        />
        <KnowledgeBaseSidebar 
            activeTab={activeTab}
            onSetActiveTab={setActiveTab}
            projectDocuments={data.documents} 
            onDocumentUpload={handleDocumentUpload}
            onDocumentDelete={handleDocumentDelete}
            onOpenDocument={handleOpenDocument}
            onUrlAdd={handleUrlAdd}
            projectSettings={data.settings}
            settingsError={null}
            settingsLoading={false}
            onUpdateSettings={handleDraftSettings}
            onApplySettings={handlePublishSettings}          
        />

        </div>
         {/* knowledgebase side bar */}
        <div>
        </div>
    </div>
     {selectedDocument && <FileDetailsModal
       document={selectedDocument}
       onClose={()=> setselectedDocumentId(null)}     
     />}
    </>
  )
}

export default ProjectPage