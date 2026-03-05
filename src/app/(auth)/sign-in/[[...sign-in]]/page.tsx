// type rfce to create this function
import React from 'react'
import { SignIn } from '@clerk/nextjs' //this is will import sign in prebuilt component and use in return

function SignInPage() { // in react we always use camel case notation
  return (
    <div className="flex items-center justify-center min-h-screen bg-sky-500">
      <SignIn />
    </div>
  )
}

export default SignInPage