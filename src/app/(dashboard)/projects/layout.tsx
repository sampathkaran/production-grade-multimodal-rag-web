// we are importing the sidebar from the components folder
//@ indicate the app folder
import { Sidebar } from "@/components/layout/Sidebar"; 
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode; //referring to the page.tsx
}) {
  const { userId } = await auth();

  if (!userId) { //checking if the user is signed in
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
