'use client'

import { SessionProvider } from "next-auth/react"

export default function AuthProvider({
  children,
} : {children : React.ReactNode}) {
  return (
    <SessionProvider >
      {children}
    </SessionProvider>
  )
}    // this file was created for making sessiopn provider and then exported AuthProvider ko layout.tsx me import karke wrap kiya 
 // layout ke return ko 