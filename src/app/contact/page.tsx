"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Phone, MapPin, Clock, CheckCircle, ArrowLeft, Send } from "lucide-react"
import { useEffect, useState } from "react"
import { GuidiumLogo } from "@/components/guidium-logo"
import Link from "next/link"

export default function ContactPage() {
  const [isVisible, setIsVisible] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData(e.target as HTMLFormElement)
    const formObject = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      company: formData.get('company') as string,
      role: formData.get('role') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formObject),
      })

      const result = await response.json()

      if (response.ok) {
        setFormSubmitted(true)
      } else {
        console.error('Contact form error:', result.error)
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex justify-between items-center">
            <Link href="/">
              <GuidiumLogo />
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="bg-[#2A9D8F] hover:bg-[#264653] text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-sm">
                <ArrowLeft className="inline-block w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Contact Form Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-[#264653]/95 via-[#2A9D8F]/95 to-[#264653]/95 relative overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 3px 3px, white 1px, transparent 0),
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%),
              radial-gradient(circle at 60px 60px, rgba(255,255,255,0.03) 2px, transparent 0),
              linear-gradient(-45deg, transparent 45%, rgba(255,255,255,0.04) 50%, transparent 55%)
            `,
            backgroundSize: "40px 40px, 200px 200px, 120px 120px, 180px 180px",
          }}
        ></div>

        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-white/4 rounded-full blur-lg"></div>
        <div className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-white/4 rounded-full blur-xl"></div>

        <div className="max-w-4xl mx-auto relative">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-xl relative overflow-hidden">
            {/* Card background elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#2A9D8F]/8 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-[#E9C46A]/8 rounded-full blur-3xl"></div>

            {formSubmitted ? (
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-[#2A9D8F] mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold text-[#264653] mb-6">Thank you for reaching out!</h2>
                <p className="text-xl text-gray-600 mb-8">
                  We've received your message and will get back to you within 24 hours.
                </p>
                <Link href="/">
                  <Button
                    size="lg"
                    className="bg-[#2A9D8F] hover:bg-[#264653] text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-10">
                  <Mail className="h-16 w-16 text-[#2A9D8F] mx-auto mb-6" />
                  <h2 className="text-3xl md:text-4xl font-bold text-[#264653] mb-6">
                    Send us a message
                  </h2>
                  <p className="text-xl text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-800 font-semibold">First Name</Label>
                      <Input id="firstName" name="firstName" placeholder="Jane" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-800 font-semibold">Last Name</Label>
                      <Input id="lastName" name="lastName" placeholder="Smith" required className="h-12" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-800 font-semibold">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="jane@company.com" required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-800 font-semibold">Phone Number (Optional)</Label>
                      <Input id="phone" name="phone" type="tel" placeholder="+44 20 7946 0958" className="h-12" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-gray-800 font-semibold">Company Name</Label>
                      <Input id="company" name="company" placeholder="Acme Inc." required className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-800 font-semibold">Your Role</Label>
                      <Input id="role" name="role" placeholder="HR Manager" className="h-12" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-gray-800 font-semibold">Subject</Label>
                    <Input id="subject" name="subject" placeholder="What can we help you with?" required className="h-12" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-800 font-semibold">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your enquiry..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#2A9D8F] hover:bg-[#264653] text-white py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Send className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    By submitting this form, you agree to our Privacy Policy and Terms of Service.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Smooth Gradient Transition */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-b from-transparent to-white/30"></div>
      </section>

      {/* Footer */}
      <section className="py-12 px-6 bg-white/90 backdrop-blur-md border-t border-gray-200/50 relative">
        <div className="max-w-6xl mx-auto relative">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Link href="/">
              <GuidiumLogo />
            </Link>
            <div className="text-gray-600 text-sm mt-4 md:mt-0">© 2025 <span style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span>. Making onboarding meaningful.</div>
          </div>
        </div>
      </section>
    </div>
  )
} 