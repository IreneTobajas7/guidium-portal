"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  TrendingUp,
  Heart,
  AlertTriangle,
  Brain,
  Calendar,
  CheckSquare,
  Trophy,
  MessageSquare,
  UserCheck,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Zap,
  Rocket,
  X,
  ChevronDown,
  Star,
  Shield,
  Target,
  Settings,
  FileText,
  BarChart3,
  UserPlus,
  BookOpen,
  Clock,
  Award,
  Lightbulb,
  Handshake,
  Globe,
  Lock,
  RefreshCw,
  Eye,
} from "lucide-react"
import { useEffect, useState } from "react"
import { GuidiumLogo } from "@/components/guidium-logo"
import Link from "next/link"

export default function GuidiumLanding() {
  const [isVisible, setIsVisible] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    setIsVisible(true)
    
    // Auto-rotate role sections
    const interval = setInterval(() => {
      setActiveSection((prev) => (prev + 1) % 3)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitted(true)
  }

  const impactStats = [
    {
      icon: AlertTriangle,
      stat: "9 out of 10",
      description: "employees have felt let down on day one",
      color: "#E76F51",
      bgGradient: "from-red-50 to-orange-50",
      borderColor: "border-red-200",
    },
    {
      icon: TrendingUp,
      stat: "82%",
      description: "increase in retention with effective onboarding",
      color: "#2A9D8F",
      bgGradient: "from-teal-50 to-emerald-50",
      borderColor: "border-teal-200",
    },
    {
      icon: Heart,
      stat: "69%",
      description: "more likely to stay three years when they feel welcome",
      color: "#F4A261",
      bgGradient: "from-orange-50 to-amber-50",
      borderColor: "border-orange-200",
    },
    {
      icon: Users,
      stat: "20%",
      description: "of new starters leave within 45 days due to poor onboarding",
      color: "#E9C46A",
      bgGradient: "from-yellow-50 to-amber-50",
      borderColor: "border-yellow-200",
    },
  ]

  const productFeatures = [
    {
      icon: Lightbulb,
      title: "Clear Expectations",
      feature: "Set the right foundation",
      impact: "New hires understand their role, goals, and how they contribute to the company's success from day one.",
      color: "#2A9D8F",
    },
    {
      icon: Handshake,
      title: "Personal Connection",
      feature: "Build meaningful relationships",
      impact: "Create genuine connections between new hires, their managers, and team members for lasting engagement.",
      color: "#E9C46A",
    },
    {
      icon: Globe,
      title: "Cultural Integration",
      feature: "Embrace company values",
      impact: "Help new employees understand and embody your company culture, mission, and core values.",
      color: "#F4A261",
    },
    {
      icon: Lock,
      title: "Security & Compliance",
      feature: "Ensure proper access",
      impact: "Streamlined setup of accounts, permissions, and compliance training for peace of mind.",
      color: "#264653",
    },
    {
      icon: Eye,
      title: "Transparent Progress",
      feature: "Track meaningful milestones",
      impact: "Clear visibility into onboarding progress helps everyone stay aligned and celebrate achievements.",
      color: "#2A9D8F",
    },
    {
      icon: RefreshCw,
      title: "Continuous Feedback",
      feature: "Support ongoing growth",
      impact: "Regular check-ins and feedback loops help new hires feel supported and valued throughout their journey.",
      color: "#E76F51",
    },
  ]

  const roleFeatures = [
    {
      role: "Managers",
      icon: Users,
      color: "#2A9D8F",
      features: [
        {
          icon: UserPlus,
          title: "Streamlined Hiring",
          description: "Automated onboarding workflows and progress tracking"
        },
        {
          icon: BarChart3,
          title: "Performance Insights",
          description: "Real-time analytics on team member engagement and progress"
        },
        {
          icon: MessageSquare,
          title: "Better Communication",
          description: "Structured check-ins and feedback systems"
        },
        {
          icon: Settings,
          title: "Easy Management",
          description: "Centralised control over onboarding processes and resources"
        }
      ]
    },
    {
      role: "Employees",
      icon: UserCheck,
      color: "#E9C46A",
      features: [
        {
          icon: BookOpen,
          title: "Clear Learning Path",
          description: "Structured onboarding journey with clear milestones"
        },
        {
          icon: Clock,
          title: "Time to Productivity",
          description: "Faster ramp-up with guided resources and support"
        },
        {
          icon: Heart,
          title: "Feeling Valued",
          description: "Personalised experience that makes them feel welcome"
        },
        {
          icon: Target,
          title: "Goal Achievement",
          description: "Clear objectives and progress tracking for success"
        }
      ]
    },
    {
      role: "Buddies",
      icon: Handshake,
      color: "#F4A261",
      features: [
        {
          icon: Shield,
          title: "Structured Support",
          description: "Clear guidelines and resources to help new hires"
        },
        {
          icon: Target,
          title: "Meaningful Impact",
          description: "Tangible ways to contribute to new hire success"
        },
        {
          icon: Award,
          title: "Recognition",
          description: "Acknowledgement for their valuable contribution"
        },
        {
          icon: Users,
          title: "Team Building",
          description: "Strengthen relationships and team cohesion"
        }
      ]
    }
  ]

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-gray-50 min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-lg sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <GuidiumLogo />
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-700 hover:text-[#2A9D8F] font-medium transition-all duration-300 hover:scale-105">
                Features
              </Link>
              <Link href="#pilot" className="text-gray-700 hover:text-[#2A9D8F] font-medium transition-all duration-300 hover:scale-105">
                Early Access
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-[#2A9D8F] font-medium transition-all duration-300 hover:scale-105">
                Contact
              </Link>
            </div>
            <Link href="/sign-in">
              <Button className="bg-gradient-to-r from-[#2A9D8F] to-[#264653] hover:from-[#264653] hover:to-[#2A9D8F] text-white px-6 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#264653] via-[#2A9D8F] to-[#264653] text-white py-32 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/3 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Geometric Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, white 2px, transparent 2px)
            `,
            backgroundSize: "100px 100px",
          }}
        ></div>

        <div className="max-w-6xl mx-auto px-6 text-center relative">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Give every new joiner<br />
            the start you wish you had.
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="#pilot">
              <Button size="lg" className="bg-gradient-to-r from-[#E9C46A] to-[#F4A261] hover:from-[#F4A261] hover:to-[#E9C46A] text-[#264653] px-8 py-4 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <Rocket className="mr-3 h-6 w-6" />
                Get Early Access
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-bold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <ArrowRight className="mr-3 h-6 w-6" />
                Learn More
              </Button>
            </Link>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-8 text-white/70">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#E9C46A]" />
              <span className="font-medium">Trusted Platform</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#2A9D8F]" />
              <span className="font-medium">Secure & Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statistics Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#264653] mb-6">
              Why onboarding{" "}
              <span className="text-[#E9C46A]">
                matters
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The numbers don't lie.<br />
              A poor onboarding will cost you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((item, index) => {
              const Icon = item.icon
              return (
                <Card
                  key={index}
                  className={`bg-gradient-to-br ${item.bgGradient} border-2 ${item.borderColor} shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-4 mx-auto">
                      <Icon className="h-8 w-8" style={{ color: item.color }} />
                    </div>
                    <h3 className="text-3xl font-bold mb-2" style={{ color: item.color }}>{item.stat}</h3>
                    <p className="text-gray-700 leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#2A9D8F] to-transparent"></div>

      {/* Enhanced Features Section */}
      <section id="features" className="py-20 px-6 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-[#2A9D8F]/5 to-[#264653]/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-tl from-[#E9C46A]/5 to-[#F4A261]/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#264653] mb-6">
              What{" "}
              <span className="text-[#2A9D8F]">
                good onboarding
              </span>{" "}
              looks like
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Six principles that transform onboarding into a meaningful journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productFeatures.map((item, index) => {
              const Icon = item.icon
              return (
                <Card
                  key={index}
                  className={`group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-105 bg-white ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F] via-[#E9C46A] to-[#F4A261] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute inset-[2px] bg-white rounded-xl"></div>
                  
                  <CardContent className="p-8 relative">
                    {/* Icon Section */}
                    <div className="flex flex-col items-center text-center mb-8">
                      <div className="relative mb-6">
                        <div
                          className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-110"
                          style={{ 
                            background: `linear-gradient(135deg, ${item.color}15, ${item.color}25)`,
                            border: `2px solid ${item.color}30`
                          }}
                        >
                          <Icon className="h-12 w-12" style={{ color: item.color }} />
                        </div>
                        {/* Floating Elements */}
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#2A9D8F] to-[#264653] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-br from-[#E9C46A] to-[#F4A261] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110" style={{ transitionDelay: '0.1s' }}></div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{item.title}</p>
                        <h3 className="text-2xl font-bold text-[#264653] group-hover:text-[#2A9D8F] transition-colors duration-300 leading-tight">{item.feature}</h3>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-700 leading-relaxed text-center text-lg group-hover:text-gray-800 transition-colors duration-300">
                      {item.impact}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Role-Based Features Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#264653] to-[#2A9D8F] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-6xl mx-auto text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-16">
            Designed for{" "}
            <span className="text-[#E9C46A]">
              every role
            </span>
          </h2>
          
          <div className="relative h-96">
            {roleFeatures.map((role, index) => {
              const Icon = role.icon
              return (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ${
                    index === activeSection ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
                  }`}
                >
                  <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl p-8 max-w-4xl mx-auto h-full">
                    <CardContent className="text-center h-full flex flex-col">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                          style={{ backgroundColor: `${role.color}20` }}
                        >
                          <Icon className="h-10 w-10" style={{ color: role.color }} />
                        </div>
                        <h3 className="text-3xl font-bold text-[#264653]">{role.role}</h3>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 flex-1">
                        {role.features.map((feature, featureIndex) => {
                          const FeatureIcon = feature.icon
                          return (
                            <div key={featureIndex} className="text-left p-3 rounded-xl bg-gray-50/50">
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: `${role.color}15` }}
                                >
                                  <FeatureIcon className="h-5 w-5" style={{ color: role.color }} />
                                </div>
                                <div>
                                  <h4 className="font-bold text-[#264653] mb-1 text-sm">{feature.title}</h4>
                                  <p className="text-gray-600 text-xs">{feature.description}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
          
          {/* Navigation Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setActiveSection((prev) => (prev - 1 + 3) % 3)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
            >
              <ChevronDown className="h-5 w-5 rotate-90" />
            </button>
            
            {/* Role Indicators */}
            <div className="flex gap-4">
              {roleFeatures.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSection(index)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    index === activeSection
                      ? "bg-white text-[#264653] shadow-lg"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  {roleFeatures[index].role}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setActiveSection((prev) => (prev + 1) % 3)}
              className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
            >
              <ChevronDown className="h-5 w-5 -rotate-90" />
            </button>
          </div>
        </div>
      </section>

      {/* Pilot Program Section */}
      <section
        id="pilot"
        className="py-20 px-6 bg-white relative overflow-hidden"
      >
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-[#2A9D8F]/15 to-[#264653]/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-[#E9C46A]/15 to-[#F4A261]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-[#2A9D8F]/10 to-[#264653]/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Geometric Pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #2A9D8F 2px, transparent 2px),
              radial-gradient(circle at 75% 75%, #264653 2px, transparent 2px)
            `,
            backgroundSize: "100px 100px",
          }}
        ></div>

        {/* Floating Elements */}
        <div className="absolute top-10 left-20 w-6 h-6 bg-[#2A9D8F] rounded-full shadow-lg"></div>
        <div className="absolute top-32 right-32 w-5 h-5 bg-[#E9C46A] rounded-full shadow-lg"></div>
        <div className="absolute bottom-20 left-1/3 w-4 h-4 bg-[#F4A261] rounded-full shadow-lg"></div>
        <div className="absolute bottom-32 right-16 w-5 h-5 bg-[#264653] rounded-full shadow-lg"></div>
        <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-[#2A9D8F] rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/4 w-4 h-4 bg-[#E9C46A] rounded-full"></div>
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-[#F4A261] rounded-full"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-[#264653] rounded-full"></div>
        <div className="absolute top-2/3 left-2/3 w-5 h-5 bg-[#2A9D8F] rounded-full"></div>
        <div className="absolute top-1/6 right-1/6 w-4 h-4 bg-[#E9C46A] rounded-full"></div>
        <div className="absolute bottom-1/6 left-1/6 w-3 h-3 bg-[#F4A261] rounded-full"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-[#264653] rounded-full"></div>
        <div className="absolute top-1/2 left-1/6 w-4 h-4 bg-[#2A9D8F] rounded-full"></div>
        <div className="absolute bottom-1/2 right-1/6 w-3 h-3 bg-[#E9C46A] rounded-full"></div>
        <div className="absolute top-1/8 left-3/4 w-5 h-5 bg-[#F4A261] rounded-full"></div>
        <div className="absolute bottom-1/8 right-3/4 w-2 h-2 bg-[#264653] rounded-full"></div>
        
        {/* Bigger Dots */}
        <div className="absolute top-1/5 left-1/5 w-10 h-10 bg-[#2A9D8F] rounded-full shadow-lg opacity-80"></div>
        <div className="absolute top-3/5 right-1/5 w-12 h-12 bg-[#E9C46A] rounded-full shadow-lg opacity-80"></div>
        <div className="absolute bottom-1/5 left-2/5 w-8 h-8 bg-[#F4A261] rounded-full shadow-lg opacity-80"></div>
        <div className="absolute top-1/2 right-1/3 w-9 h-9 bg-[#264653] rounded-full shadow-lg opacity-80"></div>
        <div className="absolute bottom-1/3 left-1/8 w-11 h-11 bg-[#2A9D8F] rounded-full shadow-lg opacity-80"></div>
        <div className="absolute top-1/8 right-1/8 w-10 h-10 bg-[#E9C46A] rounded-full shadow-lg opacity-80"></div>
        <div className="absolute bottom-1/8 left-1/2 w-8 h-8 bg-[#F4A261] rounded-full shadow-lg opacity-80"></div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="bg-white rounded-3xl p-12 shadow-2xl relative overflow-hidden border-4 border-[#2A9D8F] ring-4 ring-[#2A9D8F]/10">
            {/* Card background elements */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-[#2A9D8F]/10 to-[#264653]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-[#E9C46A]/10 to-[#F4A261]/10 rounded-full blur-3xl animate-pulse"></div>

            <Rocket className="h-16 w-16 text-[#2A9D8F] mx-auto mb-6 relative animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#264653] mb-6">
              Ready to transform<br />
              <span className="text-[#2A9D8F]">
                your onboarding?
              </span>
            </h2>
            <div className="max-w-2xl mx-auto mb-12">
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We are opening up early access to <span style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span> for a small group of companies who want to shape the future of
                onboarding.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-6 relative group bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-[#2A9D8F] transition-all duration-500 hover:scale-105 hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A9D8F]/5 to-transparent rounded-2xl group-hover:from-[#2A9D8F]/15 transition-all duration-500"></div>
                <div className="relative">
                  <div className="text-3xl font-bold text-[#2A9D8F] mb-3 group-hover:scale-110 transition-transform duration-300">Free</div>
                  <div className="text-gray-700 font-semibold mb-2">Full access</div>
                  <div className="text-sm text-gray-600">Complete platform access with all features</div>
                </div>
              </div>
              <div className="p-6 relative group bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-[#E9C46A] transition-all duration-500 hover:scale-105 hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#E9C46A]/5 to-transparent rounded-2xl group-hover:from-[#E9C46A]/15 transition-all duration-500"></div>
                <div className="relative">
                  <div className="text-3xl font-bold text-[#E9C46A] mb-3 group-hover:scale-110 transition-transform duration-300">1 month</div>
                  <div className="text-gray-700 font-semibold mb-2">No commitment</div>
                  <div className="text-sm text-gray-600">Try risk-free with no long-term contracts</div>
                </div>
              </div>
              <div className="p-6 relative group bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 hover:border-[#F4A261] transition-all duration-500 hover:scale-105 hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F4A261]/5 to-transparent rounded-2xl group-hover:from-[#F4A261]/15 transition-all duration-500"></div>
                <div className="relative">
                  <div className="text-3xl font-bold text-[#F4A261] mb-3 group-hover:scale-110 transition-transform duration-300">1:1</div>
                  <div className="text-gray-700 font-semibold mb-2">Dedicated support</div>
                  <div className="text-sm text-gray-600">Personal guidance throughout your journey</div>
                </div>
              </div>
            </div>

            {!showForm ? (
              <div className="relative">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#2A9D8F] to-[#264653] hover:from-[#264653] hover:to-[#2A9D8F] text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 relative group overflow-hidden"
                  onClick={() => setShowForm(true)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative flex items-center">
                    Get Early Access
                    <Sparkles className="ml-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                  </span>
                </Button>
                <div className="mt-4 text-sm text-gray-500">
                  ⚡ Limited spots available • Join the pilot programme
                </div>
              </div>
            ) : formSubmitted ? (
              <div className="bg-gradient-to-br from-[#2A9D8F]/10 to-[#264653]/10 p-8 rounded-2xl border border-[#2A9D8F]/20 max-w-md mx-auto">
                <CheckCircle className="h-12 w-12 text-[#2A9D8F] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#264653] mb-3">Thank you for your interest!</h3>
                                  <p className="text-gray-600">
                    We&apos;ve received your application for early access. Our team will be in touch with you shortly.
                  </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-2xl max-w-lg mx-auto relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-5 w-5" />
                  <span className="sr-only">Close</span>
                </Button>
                <h3 className="text-2xl font-bold text-[#264653] mb-6">Apply for Early Access</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                      <Input id="firstName" placeholder="Jane" required className="h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                      <Input id="lastName" placeholder="Smith" required className="h-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700 font-medium">Work Email</Label>
                    <Input id="email" type="email" placeholder="jane@company.com" required className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-gray-700 font-medium">Company Name</Label>
                    <Input id="company" placeholder="Acme Inc." required className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-gray-700 font-medium">Your Role</Label>
                    <Input id="role" placeholder="HR Manager" required className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees" className="text-gray-700 font-medium">Number of Employees</Label>
                    <Input id="employees" placeholder="e.g. 50-100" required className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-gray-700 font-medium">Why are you interested in <span style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span>?</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your current onboarding challenges..."
                      className="min-h-[100px] resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#2A9D8F] to-[#264653] hover:from-[#264653] hover:to-[#2A9D8F] text-white py-3 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105"
                  >
                    Submit Application
                  </Button>
                  <p className="text-sm text-gray-500 text-center mt-4">
                    By submitting, you agree to our Privacy Policy and Terms of Service.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 bg-[#264653] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Start your <span style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span> pilot
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Join the group of companies shaping the future of onboarding.<br />
            Limited spots available.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#pilot">
              <Button size="lg" className="bg-gradient-to-r from-[#2A9D8F] to-[#E9C46A] hover:from-[#E9C46A] hover:to-[#2A9D8F] text-[#264653] px-10 py-5 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105">
                <CheckCircle className="mr-3 h-5 w-5" />
                Get Started Today
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 text-lg font-bold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Sparkles className="mr-3 h-5 w-5" />
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-gray-200/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <GuidiumLogo />
            </div>
            <div className="text-gray-600 text-sm mt-4 md:mt-0">© 2025 <span style={{ fontFamily: 'var(--font-oregano)' }}>GUIDIUM</span>. Making onboarding meaningful.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
