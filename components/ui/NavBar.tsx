'use client'
import React from 'react'
import Link from 'next/link'
import { useSession , signOut } from 'next-auth/react'
// where ever we see this use method , we cannot directly take data from it ,because it is a hook , we have to form a method like router we make from userouter kind of stuff....
import { User } from 'next-auth'
import { Button } from './button'
import { usePathname } from 'next/navigation' 

const NavBar = () => {

    const { data: session } = useSession(); // we can get user data from useSession and then we can check if user is logged in or not and then we can show different nav bar items based on that
    // everything we injected in session (session,token) in option.ts file will be in User type of next-auth , so we can use it like session.user.username or session.user.email etc.

    const user:User = session?.user as User; // we are typecasting session.user to User type of next-auth
    const pathname = usePathname();
    if (pathname === "/") return null;
    return (
        <nav  className='p-4 md:p-6 shadow-md '>
            <div className='container mx-auto flex flex-col md:flex-row justify-between items-center'>
                <a className='text-xl font-bold mb-4 md:mb-0' href="#">Med Assistant</a>
                {
                    session ? (
                        <>
                        <span className='mr-4'>Welcome {user?.username || user?.email}</span>
                        <Button className='w-full md:w-auto' onClick={()=> signOut()}>LogOut</Button>
                        </>
                    ) : (
                        <Link href='/signIn'>
                            <Button className='w-full md:w-auto'>Login</Button>
                        </Link>
                    ) 
                }
            </div>
        </nav>
  )
}

export default NavBar