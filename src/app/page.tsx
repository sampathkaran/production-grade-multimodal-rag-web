import React from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation';

async function HomePage(){
// auth helper function returns the current object of the user
  const {userId} = await auth(); // we define it as await as it take time to check cookies etc
  //set the if else condition if userid is present go to projects page esle go to sign in page
  if (userId){
    redirect("/projects");
  } else{
    redirect("/sign-in")
  }
}

export default HomePage 


