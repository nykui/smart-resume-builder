"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PersonalInfo {
  fullName: string
  email: string
  phone: string
  location: string
  website: string
  linkedin: string
  summary: string
}

interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa?: string
}

interface Skill {
  id: string
  name: string
  category: string
}

interface ResumeData {
  personalInfo: PersonalInfo
  experience: Experience[]
  education: Education[]
  skills: Skill[]
}

interface PublicResume {
  id: string
  shareId: string
  name: string
  resumeData: ResumeData
  createdAt: string
  isActive: boolean
  viewCount: number
}

interface PublicSharingService {
  getPublicResume: (shareId: string) => Promise<PublicResume | null>
  incrementViewCount: (shareId: string) => Promise<void>
}

class LocalStoragePublicSharingService implements PublicSharingService {
  private readonly STORAGE_KEY = "public_resumes"

  private getStoredPublicResumes(): PublicResume[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private setStoredPublicResumes(resumes: PublicResume[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resumes))
  }

  async getPublicResume(shareId: string): Promise<PublicResume | null> {
    const resumes = this.getStoredPublicResumes()
    return resumes.find((r) => r.shareId === shareId && r.isActive) || null
  }

  async incrementViewCount(shareId: string): Promise<void> {
    const resumes = this.getStoredPublicResumes()
    const index = resumes.findIndex((r) => r.shareId === shareId)

    if (index !== -1) {
      resumes[index].viewCount += 1
      this.setStoredPublicResumes(resumes)
    }
  }
}

const publicSharingService = new LocalStoragePublicSharingService()

export default function PublicResumePage({ params }: { params: { shareId: string } }) {
  const [publicResume, setPublicResume] = useState<PublicResume | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPublicResume = async () => {
      try {
        const resume = await publicSharingService.getPublicResume(params.shareId)
        if (resume) {
          setPublicResume(resume)
          // Increment view count
          await publicSharingService.incrementViewCount(params.shareId)
        } else {
          setError("Resume not found or no longer available")
        }
      } catch (err) {
        setError("Failed to load resume")
        console.error("Error loading public resume:", err)
      } finally {
        setLoading(false)
      }
    }

    loadPublicResume()
  }, [params.shareId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading resume...</p>
        </div>
      </div>
    )
  }

  if (error || !publicResume) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Resume Not Found</h1>
          <p className="text-slate-600 mb-6">
            {error || "This resume link may have been removed or is no longer available."}
          </p>
          <Link href="/">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Create Your Own Resume
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                <ArrowLeft className="w-4 h-4" />
                Create Your Resume
              </Button>
            </Link>
            <Badge variant="outline" className="text-blue-700 border-blue-200">
              Public Resume
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{publicResume.name}</h1>
          <p className="text-slate-600">Shared resume • {publicResume.viewCount} views</p>
        </div>

        {/* Resume Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resume</CardTitle>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </CardHeader>
            <CardContent>
              <PublicResumePreview resumeData={publicResume.resumeData} />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-slate-200">
          <p className="text-slate-500 mb-4">Want to create your own professional resume?</p>
          <Link href="/">
            <Button className="flex items-center gap-2 mx-auto">Get Started Free</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

// Public Resume Preview Component
function PublicResumePreview({ resumeData }: { resumeData: ResumeData }) {
  const { personalInfo, experience, education, skills } = resumeData

  return (
    <div className="bg-white p-8 text-sm max-w-none">
      {/* Header */}
      <div className="text-center mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{personalInfo.fullName || "Professional Resume"}</h1>
        <div className="flex flex-wrap justify-center gap-6 text-slate-600">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
        {(personalInfo.website || personalInfo.linkedin) && (
          <div className="flex flex-wrap justify-center gap-6 text-blue-600 mt-3">
            {personalInfo.website && <span>{personalInfo.website}</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-1">
            Professional Summary
          </h2>
          <p className="text-slate-700 leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-1">Work Experience</h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{exp.position}</h3>
                    <p className="text-slate-700 font-medium">{exp.company}</p>
                  </div>
                  <div className="text-slate-600 text-sm">
                    {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                  </div>
                </div>
                {exp.description && <p className="text-slate-700 mt-2 leading-relaxed">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-1">Education</h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-slate-700">{edu.institution}</p>
                    {edu.gpa && <p className="text-slate-600">GPA: {edu.gpa}</p>}
                  </div>
                  <div className="text-slate-600 text-sm">
                    {edu.startDate} - {edu.endDate}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-1">Skills</h2>
          <div className="space-y-3">
            {Object.entries(
              skills.reduce(
                (acc, skill) => {
                  if (!acc[skill.category]) acc[skill.category] = []
                  acc[skill.category].push(skill.name)
                  return acc
                },
                {} as Record<string, string[]>,
              ),
            ).map(([category, skillNames]) => (
              <div key={category}>
                <span className="font-semibold text-slate-900">{category}: </span>
                <span className="text-slate-700">{skillNames.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
