// import React from 'react'
'use client'
import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
    
import messages from '@/message.json'
import Autoplay from 'embla-carousel-autoplay'

const Home = () => {
  return (
    <>
    <main className='flex-grow flex flex-col items-center justify-center px-4 md:px-24 py-12'>
      <section className='text-center mb-8 md:mb-12'>
        <h1 className='text-3xl font-bold md:text-5xl'>Welcome to Med Assistant</h1>
        <p className='mt-4 text-lg md:text-xl'>Get verified information about your conditions</p>
      </section>
      <Carousel 
      plugins={[Autoplay({delay: 2000})]}
      className="w-full max-w-[12rem] sm:max-w-xs">
      <CarouselContent>
        {
          messages.map((message , index )=>(
            <CarouselItem key={index}>
            <div className="p-1">
              <Card>
                <CardHeader>
                  {
                    message.title
                  }
                </CardHeader>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{
                message.content
                }</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
          ))
        }
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>

    </main>
    <footer className="text-center p-4 md:p-6 bg-gray-800 text-white">
      <p>&copy; 2026 Med Assistant App. All rights reserved.</p>
    </footer>
    </>
  )
}

export default Home