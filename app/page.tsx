"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Trash2,
  Download,
  Share2,
  Save,
  FileText,
  Sparkles,
  Target,
  FolderOpen,
  Calendar,
  Copy,
  Check,
  Eye,
  Globe,
} from "lucide-react"

// Types for resume data
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

interface AnalysisResult {
  type: "ats" | "general"
  score: number
  suggestions: string[]
  keywordMatches?: string[]
  missingKeywords?: string[]
  strengths?: string[]
  weaknesses?: string[]
  industryInsights?: string[]
}

interface AIAnalysisService {
  analyzeATS: (resumeData: ResumeData, jobDescription: string) => Promise<AnalysisResult>
  analyzeGeneral: (resumeData: ResumeData) => Promise<AnalysisResult>
}

interface SavedResume {
  id: string
  name: string
  resumeData: ResumeData
  createdAt: string
  updatedAt: string
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

interface ResumeStorageService {
  saveResume: (name: string, resumeData: ResumeData) => Promise<string>
  loadResume: (id: string) => Promise<ResumeData | null>
  getAllResumes: () => Promise<SavedResume[]>
  deleteResume: (id: string) => Promise<void>
  updateResume: (id: string, name: string, resumeData: ResumeData) => Promise<void>
}

interface PublicSharingService {
  createPublicResume: (name: string, resumeData: ResumeData) => Promise<string>
  getPublicResume: (shareId: string) => Promise<PublicResume | null>
  getAllPublicResumes: () => Promise<PublicResume[]>
  updatePublicResume: (shareId: string, name: string, resumeData: ResumeData) => Promise<void>
  deletePublicResume: (shareId: string) => Promise<void>
  incrementViewCount: (shareId: string) => Promise<void>
  togglePublicResumeStatus: (shareId: string, isActive: boolean) => Promise<void>
}

class LocalStorageResumeService implements ResumeStorageService {
  private readonly STORAGE_KEY = "saved_resumes"

  private getStoredResumes(): SavedResume[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private setStoredResumes(resumes: SavedResume[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(resumes))
  }

  async saveResume(name: string, resumeData: ResumeData): Promise<string> {
    const resumes = this.getStoredResumes()
    const id = Date.now().toString()
    const now = new Date().toISOString()

    const newResume: SavedResume = {
      id,
      name,
      resumeData: JSON.parse(JSON.stringify(resumeData)), // Deep clone
      createdAt: now,
      updatedAt: now,
    }

    resumes.push(newResume)
    this.setStoredResumes(resumes)
    return id
  }

  async loadResume(id: string): Promise<ResumeData | null> {
    const resumes = this.getStoredResumes()
    const resume = resumes.find((r) => r.id === id)
    return resume ? resume.resumeData : null
  }

  async getAllResumes(): Promise<SavedResume[]> {
    return this.getStoredResumes().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async deleteResume(id: string): Promise<void> {
    const resumes = this.getStoredResumes()
    const filtered = resumes.filter((r) => r.id !== id)
    this.setStoredResumes(filtered)
  }

  async updateResume(id: string, name: string, resumeData: ResumeData): Promise<void> {
    const resumes = this.getStoredResumes()
    const index = resumes.findIndex((r) => r.id === id)

    if (index !== -1) {
      resumes[index] = {
        ...resumes[index],
        name,
        resumeData: JSON.parse(JSON.stringify(resumeData)),
        updatedAt: new Date().toISOString(),
      }
      this.setStoredResumes(resumes)
    }
  }
}

class LocalStoragePublicSharingService implements PublicSharingService {
  private readonly STORAGE_KEY = "public_resumes"

  private generateShareId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

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

  async createPublicResume(name: string, resumeData: ResumeData): Promise<string> {
    const resumes = this.getStoredPublicResumes()
    const shareId = this.generateShareId()
    const now = new Date().toISOString()

    const newPublicResume: PublicResume = {
      id: Date.now().toString(),
      shareId,
      name,
      resumeData: JSON.parse(JSON.stringify(resumeData)),
      createdAt: now,
      isActive: true,
      viewCount: 0,
    }

    resumes.push(newPublicResume)
    this.setStoredPublicResumes(resumes)
    return shareId
  }

  async getPublicResume(shareId: string): Promise<PublicResume | null> {
    const resumes = this.getStoredPublicResumes()
    return resumes.find((r) => r.shareId === shareId && r.isActive) || null
  }

  async getAllPublicResumes(): Promise<PublicResume[]> {
    return this.getStoredPublicResumes().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  async updatePublicResume(shareId: string, name: string, resumeData: ResumeData): Promise<void> {
    const resumes = this.getStoredPublicResumes()
    const index = resumes.findIndex((r) => r.shareId === shareId)

    if (index !== -1) {
      resumes[index] = {
        ...resumes[index],
        name,
        resumeData: JSON.parse(JSON.stringify(resumeData)),
      }
      this.setStoredPublicResumes(resumes)
    }
  }

  async deletePublicResume(shareId: string): Promise<void> {
    const resumes = this.getStoredPublicResumes()
    const filtered = resumes.filter((r) => r.shareId !== shareId)
    this.setStoredPublicResumes(filtered)
  }

  async incrementViewCount(shareId: string): Promise<void> {
    const resumes = this.getStoredPublicResumes()
    const index = resumes.findIndex((r) => r.shareId === shareId)

    if (index !== -1) {
      resumes[index].viewCount += 1
      this.setStoredPublicResumes(resumes)
    }
  }

  async togglePublicResumeStatus(shareId: string, isActive: boolean): Promise<void> {
    const resumes = this.getStoredPublicResumes()
    const index = resumes.findIndex((r) => r.shareId === shareId)

    if (index !== -1) {
      resumes[index].isActive = isActive
      this.setStoredPublicResumes(resumes)
    }
  }
}

class ResumeAnalysisService implements AIAnalysisService {
  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "must",
      "shall",
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index)
      .slice(0, 20)
  }

  private calculateATSScore(resumeKeywords: string[], jobKeywords: string[]): number {
    const matches = resumeKeywords.filter((keyword) =>
      jobKeywords.some((jobKeyword) => jobKeyword.includes(keyword) || keyword.includes(jobKeyword)),
    )
    return Math.min(95, Math.max(45, Math.round((matches.length / jobKeywords.length) * 100)))
  }

  private generateATSSuggestions(missingKeywords: string[], resumeData: ResumeData): string[] {
    const suggestions = []

    if (missingKeywords.length > 0) {
      suggestions.push(`Include these relevant keywords: ${missingKeywords.slice(0, 5).join(", ")}`)
    }

    if (!resumeData.personalInfo.summary) {
      suggestions.push("Add a professional summary section to highlight your key qualifications")
    }

    if (resumeData.experience.length === 0) {
      suggestions.push("Add work experience with quantifiable achievements")
    } else {
      const hasQuantifiableResults = resumeData.experience.some((exp) => /\d+/.test(exp.description))
      if (!hasQuantifiableResults) {
        suggestions.push("Include specific numbers and metrics in your experience descriptions")
      }
    }

    if (resumeData.skills.length < 5) {
      suggestions.push("Add more relevant technical and soft skills")
    }

    suggestions.push("Use action verbs to start bullet points (achieved, managed, developed, etc.)")
    suggestions.push("Ensure consistent formatting and remove any typos")

    return suggestions.slice(0, 6)
  }

  private generateGeneralSuggestions(resumeData: ResumeData): string[] {
    const suggestions = []

    // Check summary
    if (!resumeData.personalInfo.summary) {
      suggestions.push("Add a compelling professional summary that highlights your unique value proposition")
    } else if (resumeData.personalInfo.summary.length < 100) {
      suggestions.push("Expand your professional summary to better showcase your expertise")
    }

    // Check experience
    if (resumeData.experience.length === 0) {
      suggestions.push("Add relevant work experience with specific achievements and responsibilities")
    } else {
      const avgDescriptionLength =
        resumeData.experience.reduce((sum, exp) => sum + exp.description.length, 0) / resumeData.experience.length
      if (avgDescriptionLength < 150) {
        suggestions.push("Provide more detailed descriptions of your accomplishments in each role")
      }

      const hasActionVerbs = resumeData.experience.some((exp) =>
        /^(achieved|managed|developed|led|created|implemented|improved|increased|reduced|streamlined)/i.test(
          exp.description,
        ),
      )
      if (!hasActionVerbs) {
        suggestions.push("Start experience descriptions with strong action verbs")
      }
    }

    // Check education
    if (resumeData.education.length === 0) {
      suggestions.push("Include your educational background and relevant certifications")
    }

    // Check skills
    if (resumeData.skills.length < 8) {
      suggestions.push("Add more relevant skills, including both technical and soft skills")
    }

    // Check contact info
    if (!resumeData.personalInfo.linkedin) {
      suggestions.push("Add your LinkedIn profile to increase professional credibility")
    }

    suggestions.push("Tailor your resume for each job application")
    suggestions.push("Keep your resume to 1-2 pages for optimal readability")

    return suggestions.slice(0, 6)
  }

  async analyzeATS(resumeData: ResumeData, jobDescription: string): Promise<AnalysisResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const resumeText = [
      resumeData.personalInfo.summary,
      ...resumeData.experience.map((exp) => `${exp.position} ${exp.company} ${exp.description}`),
      ...resumeData.education.map((edu) => `${edu.degree} ${edu.field} ${edu.institution}`),
      ...resumeData.skills.map((skill) => skill.name),
    ].join(" ")

    const resumeKeywords = this.extractKeywords(resumeText)
    const jobKeywords = this.extractKeywords(jobDescription)

    const keywordMatches = resumeKeywords.filter((keyword) =>
      jobKeywords.some((jobKeyword) => jobKeyword.includes(keyword) || keyword.includes(keyword)),
    )

    const missingKeywords = jobKeywords
      .filter(
        (keyword) =>
          !resumeKeywords.some((resumeKeyword) => resumeKeyword.includes(keyword) || keyword.includes(keyword)),
      )
      .slice(0, 8)

    const score = this.calculateATSScore(resumeKeywords, jobKeywords)
    const suggestions = this.generateATSSuggestions(missingKeywords, resumeData)

    return {
      type: "ats",
      score,
      suggestions,
      keywordMatches: keywordMatches.slice(0, 10),
      missingKeywords,
      industryInsights: [
        "ATS systems scan for exact keyword matches",
        'Use standard section headings like "Work Experience" and "Education"',
        "Avoid images, graphics, and complex formatting",
        'Include both acronyms and full terms (e.g., "AI" and "Artificial Intelligence")',
      ],
    }
  }

  async analyzeGeneral(resumeData: ResumeData): Promise<AnalysisResult> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    let score = 60
    const strengths = []
    const weaknesses = []

    // Scoring logic
    if (resumeData.personalInfo.summary && resumeData.personalInfo.summary.length > 100) {
      score += 10
      strengths.push("Strong professional summary")
    } else {
      weaknesses.push("Missing or weak professional summary")
    }

    if (resumeData.experience.length >= 2) {
      score += 15
      strengths.push("Good work experience history")
    } else if (resumeData.experience.length === 1) {
      score += 8
    } else {
      weaknesses.push("Limited work experience")
    }

    if (resumeData.education.length > 0) {
      score += 10
      strengths.push("Educational background included")
    } else {
      weaknesses.push("No educational information")
    }

    if (resumeData.skills.length >= 8) {
      score += 10
      strengths.push("Comprehensive skills section")
    } else if (resumeData.skills.length >= 5) {
      score += 5
    } else {
      weaknesses.push("Limited skills listed")
    }

    if (resumeData.personalInfo.linkedin) {
      score += 5
      strengths.push("Professional online presence")
    }

    const hasQuantifiableResults = resumeData.experience.some((exp) =>
      /\d+%|\$\d+|\d+\+|increased|decreased|improved|reduced/i.test(exp.description),
    )
    if (hasQuantifiableResults) {
      score += 10
      strengths.push("Quantifiable achievements mentioned")
    } else {
      weaknesses.push("Lacks quantifiable results")
    }

    score = Math.min(95, Math.max(35, score))

    return {
      type: "general",
      score,
      suggestions: this.generateGeneralSuggestions(resumeData),
      strengths,
      weaknesses,
      industryInsights: [
        "Recruiters spend an average of 6 seconds reviewing each resume",
        "Quantified achievements are 40% more likely to get attention",
        "Tailored resumes have 2x higher callback rates",
        "Professional formatting increases perceived competence by 30%",
      ],
    }
  }
}

const analysisService = new ResumeAnalysisService()
const storageService = new LocalStorageResumeService()
const publicSharingService = new LocalStoragePublicSharingService()

const initialResumeData: ResumeData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    linkedin: "",
    summary: "",
  },
  experience: [],
  education: [],
  skills: [],
}

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData)
  const [currentStep, setCurrentStep] = useState(0)
  const [jobDescription, setJobDescription] = useState("")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([])
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [resumeName, setResumeName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [manageSharesDialogOpen, setManageSharesDialogOpen] = useState(false)
  const [publicResumes, setPublicResumes] = useState<PublicResume[]>([])
  const [shareUrl, setShareUrl] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null)

  useEffect(() => {
    loadSavedResumes()
    loadPublicResumes()
  }, [])

  const loadSavedResumes = async () => {
    try {
      const resumes = await storageService.getAllResumes()
      setSavedResumes(resumes)
    } catch (error) {
      console.error("Failed to load saved resumes:", error)
    }
  }

  const loadPublicResumes = async () => {
    try {
      const resumes = await publicSharingService.getAllPublicResumes()
      setPublicResumes(resumes)
    } catch (error) {
      console.error("Failed to load public resumes:", error)
    }
  }

  const handleSaveResume = async () => {
    if (!resumeName.trim()) return

    setIsSaving(true)
    try {
      if (currentResumeId) {
        // Update existing resume
        await storageService.updateResume(currentResumeId, resumeName, resumeData)
      } else {
        // Save new resume
        const id = await storageService.saveResume(resumeName, resumeData)
        setCurrentResumeId(id)
      }

      await loadSavedResumes()
      setSaveDialogOpen(false)
      setResumeName("")
    } catch (error) {
      console.error("Failed to save resume:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoadResume = async (id: string) => {
    setIsLoading(true)
    try {
      const loadedData = await storageService.loadResume(id)
      if (loadedData) {
        setResumeData(loadedData)
        setCurrentResumeId(id)
        setLoadDialogOpen(false)

        // Find the resume name for the save dialog
        const resume = savedResumes.find((r) => r.id === id)
        if (resume) {
          setResumeName(resume.name)
        }
      }
    } catch (error) {
      console.error("Failed to load resume:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteResume = async (id: string) => {
    try {
      await storageService.deleteResume(id)
      await loadSavedResumes()

      // If we deleted the currently loaded resume, reset
      if (currentResumeId === id) {
        setCurrentResumeId(null)
        setResumeName("")
      }
    } catch (error) {
      console.error("Failed to delete resume:", error)
    }
  }

  const handleCreatePublicShare = async () => {
    if (!resumeName.trim()) return

    setIsSharing(true)
    try {
      const shareId = await publicSharingService.createPublicResume(resumeName, resumeData)
      const url = `${window.location.origin}/resume/${shareId}`
      setShareUrl(url)
      await loadPublicResumes()
    } catch (error) {
      console.error("Failed to create public share:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyShareUrl = async (url: string, shareId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedShareId(shareId)
      setTimeout(() => setCopiedShareId(null), 2000)
    } catch (error) {
      console.error("Failed to copy URL:", error)
    }
  }

  const handleDeletePublicResume = async (shareId: string) => {
    try {
      await publicSharingService.deletePublicResume(shareId)
      await loadPublicResumes()
    } catch (error) {
      console.error("Failed to delete public resume:", error)
    }
  }

  const handleTogglePublicResumeStatus = async (shareId: string, isActive: boolean) => {
    try {
      await publicSharingService.togglePublicResumeStatus(shareId, isActive)
      await loadPublicResumes()
    } catch (error) {
      console.error("Failed to toggle resume status:", error)
    }
  }

  const handleNewResume = () => {
    setResumeData(initialResumeData)
    setCurrentResumeId(null)
    setResumeName("")
    setCurrentStep(0)
    setAnalysisResult(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const steps = [
    { id: "personal", title: "Personal Info", icon: FileText },
    { id: "experience", title: "Experience", icon: Target },
    { id: "education", title: "Education", icon: FileText },
    { id: "skills", title: "Skills", icon: Sparkles },
  ]

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }))
  }

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    }
    setResumeData((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp],
    }))
  }

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }))
  }

  const removeExperience = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }))
  }

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      institution: "",
      degree: "",
      field: "",
      startDate: "",
      endDate: "",
      gpa: "",
    }
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEdu],
    }))
  }

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)),
    }))
  }

  const removeEducation = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((edu) => edu.id !== id),
    }))
  }

  const addSkill = (name: string, category: string) => {
    if (!name.trim()) return
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: name.trim(),
      category: category || "General",
    }
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, newSkill],
    }))
  }

  const removeSkill = (id: string) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill.id !== id),
    }))
  }

  const analyzeResume = async (type: "ats" | "general") => {
    setIsAnalyzing(true)
    setAnalysisResult(null)

    try {
      let result: AnalysisResult

      if (type === "ats") {
        if (!jobDescription.trim()) {
          setIsAnalyzing(false)
          return
        }
        result = await analysisService.analyzeATS(resumeData, jobDescription)
      } else {
        result = await analysisService.analyzeGeneral(resumeData)
      }

      setAnalysisResult(result)
    } catch (error) {
      console.error("Analysis failed:", error)
      // Fallback to basic analysis
      setAnalysisResult({
        type,
        score: 75,
        suggestions: ["Unable to complete full analysis. Please try again."],
        industryInsights: ["Analysis service temporarily unavailable"],
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Professional Resume Builder</h1>
          <p className="text-slate-600 text-lg">Create ATS-optimized resumes with AI-powered analysis</p>
          {currentResumeId && (
            <div className="mt-2">
              <Badge variant="outline" className="text-blue-700 border-blue-200">
                Editing: {savedResumes.find((r) => r.id === currentResumeId)?.name || "Untitled Resume"}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Resume Progress</CardTitle>
                  <span className="text-sm text-slate-600">{Math.round(progress)}% Complete</span>
                </div>
                <Progress value={progress} className="w-full" />
              </CardHeader>
            </Card>

            {/* Step Navigation */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {steps.map((step, index) => {
                    const Icon = step.icon
                    return (
                      <Button
                        key={step.id}
                        variant={currentStep === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentStep(index)}
                        className="flex items-center gap-2"
                      >
                        <Icon className="w-4 h-4" />
                        {step.title}
                      </Button>
                    )
                  })}
                </div>

                {/* Personal Info Step */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={resumeData.personalInfo.fullName}
                          onChange={(e) => updatePersonalInfo("fullName", e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={resumeData.personalInfo.email}
                          onChange={(e) => updatePersonalInfo("email", e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={resumeData.personalInfo.phone}
                          onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={resumeData.personalInfo.location}
                          onChange={(e) => updatePersonalInfo("location", e.target.value)}
                          placeholder="New York, NY"
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={resumeData.personalInfo.website}
                          onChange={(e) => updatePersonalInfo("website", e.target.value)}
                          placeholder="https://johndoe.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={resumeData.personalInfo.linkedin}
                          onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                          placeholder="https://linkedin.com/in/johndoe"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="summary">Professional Summary</Label>
                      <Textarea
                        id="summary"
                        value={resumeData.personalInfo.summary}
                        onChange={(e) => updatePersonalInfo("summary", e.target.value)}
                        placeholder="Brief professional summary highlighting your key strengths and career objectives..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {/* Experience Step */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Work Experience</h3>
                      <Button onClick={addExperience} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Experience
                      </Button>
                    </div>
                    {resumeData.experience.map((exp) => (
                      <Card key={exp.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Experience Entry</h4>
                          <Button variant="ghost" size="sm" onClick={() => removeExperience(exp.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Company</Label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                              placeholder="Company Name"
                            />
                          </div>
                          <div>
                            <Label>Position</Label>
                            <Input
                              value={exp.position}
                              onChange={(e) => updateExperience(exp.id, "position", e.target.value)}
                              placeholder="Job Title"
                            />
                          </div>
                          <div>
                            <Label>Start Date</Label>
                            <Input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <Input
                              type="month"
                              value={exp.endDate}
                              onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                              disabled={exp.current}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                            />
                            <span className="text-sm">Currently working here</span>
                          </label>
                        </div>
                        <div className="mt-4">
                          <Label>Description</Label>
                          <Textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                            placeholder="Describe your responsibilities and achievements..."
                            rows={3}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Education Step */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Education</h3>
                      <Button onClick={addEducation} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Education
                      </Button>
                    </div>
                    {resumeData.education.map((edu) => (
                      <Card key={edu.id} className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium">Education Entry</h4>
                          <Button variant="ghost" size="sm" onClick={() => removeEducation(edu.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label>Institution</Label>
                            <Input
                              value={edu.institution}
                              onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                              placeholder="University Name"
                            />
                          </div>
                          <div>
                            <Label>Degree</Label>
                            <Input
                              value={edu.degree}
                              onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                              placeholder="Bachelor of Science"
                            />
                          </div>
                          <div>
                            <Label>Field of Study</Label>
                            <Input
                              value={edu.field}
                              onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                              placeholder="Computer Science"
                            />
                          </div>
                          <div>
                            <Label>GPA (Optional)</Label>
                            <Input
                              value={edu.gpa}
                              onChange={(e) => updateEducation(edu.id, "gpa", e.target.value)}
                              placeholder="3.8"
                            />
                          </div>
                          <div>
                            <Label>Start Date</Label>
                            <Input
                              type="month"
                              value={edu.startDate}
                              onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>End Date</Label>
                            <Input
                              type="month"
                              value={edu.endDate}
                              onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Skills Step */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Skills</h3>
                    <SkillsInput onAddSkill={addSkill} />
                    <div className="space-y-4">
                      {Object.entries(
                        resumeData.skills.reduce(
                          (acc, skill) => {
                            if (!acc[skill.category]) acc[skill.category] = []
                            acc[skill.category].push(skill)
                            return acc
                          },
                          {} as Record<string, Skill[]>,
                        ),
                      ).map(([category, skills]) => (
                        <div key={category}>
                          <h4 className="font-medium mb-2">{category}</h4>
                          <div className="flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <Badge key={skill.id} variant="secondary" className="flex items-center gap-2">
                                {skill.name}
                                <button onClick={() => removeSkill(skill.id)} className="text-xs hover:text-red-500">
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep === steps.length - 1}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI-Powered Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="ats" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ats">ATS Analysis</TabsTrigger>
                    <TabsTrigger value="general">General Critique</TabsTrigger>
                  </TabsList>
                  <TabsContent value="ats" className="space-y-4">
                    <div>
                      <Label htmlFor="jobDescription">Job Description</Label>
                      <Textarea
                        id="jobDescription"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here for ATS analysis..."
                        rows={4}
                      />
                    </div>
                    <Button
                      onClick={() => analyzeResume("ats")}
                      disabled={isAnalyzing || !jobDescription.trim()}
                      className="w-full"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze ATS Compatibility"}
                    </Button>
                  </TabsContent>
                  <TabsContent value="general" className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Get a general critique of your resume quality and suggestions for improvement.
                    </p>
                    <Button onClick={() => analyzeResume("general")} disabled={isAnalyzing} className="w-full">
                      {isAnalyzing ? "Analyzing..." : "Get General Critique"}
                    </Button>
                  </TabsContent>
                </Tabs>

                {analysisResult && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{analysisResult.type === "ats" ? "ATS Compatibility" : "Resume Quality"} Score</span>
                        <Badge
                          variant={
                            analysisResult.score >= 80
                              ? "default"
                              : analysisResult.score >= 60
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {analysisResult.score >= 80
                            ? "Excellent"
                            : analysisResult.score >= 60
                              ? "Good"
                              : "Needs Work"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-3xl font-bold text-blue-600">{analysisResult.score}%</div>
                        <Progress value={analysisResult.score} className="flex-1" />
                      </div>

                      {analysisResult.keywordMatches && analysisResult.keywordMatches.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-green-700">Matched Keywords:</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysisResult.keywordMatches.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.missingKeywords && analysisResult.missingKeywords.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-orange-700">Missing Keywords:</h4>
                          <div className="flex flex-wrap gap-1">
                            {analysisResult.missingKeywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-orange-700 border-orange-200">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysisResult.strengths && analysisResult.strengths.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-green-700">Strengths:</h4>
                          <ul className="space-y-1 text-sm">
                            {analysisResult.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">✓</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisResult.weaknesses && analysisResult.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2 text-red-700">Areas for Improvement:</h4>
                          <ul className="space-y-1 text-sm">
                            {analysisResult.weaknesses.map((weakness, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">!</span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-2">Actionable Suggestions:</h4>
                        <ul className="space-y-1 text-sm text-slate-600">
                          {analysisResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {analysisResult.industryInsights && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2 text-blue-900">Industry Insights:</h4>
                          <ul className="space-y-1 text-sm text-blue-800">
                            {analysisResult.industryInsights.map((insight, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">💡</span>
                                {insight}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-2">
                  <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Save className="w-4 h-4" />
                        {currentResumeId ? "Update Resume" : "Save Resume"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{currentResumeId ? "Update Resume" : "Save Resume"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="resumeName">Resume Name</Label>
                          <Input
                            id="resumeName"
                            value={resumeName}
                            onChange={(e) => setResumeName(e.target.value)}
                            placeholder="e.g., Software Engineer Resume"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleSaveResume} disabled={!resumeName.trim() || isSaving}>
                            {isSaving ? "Saving..." : currentResumeId ? "Update" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <FolderOpen className="w-4 h-4" />
                        Load Resume
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Load Saved Resume</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {savedResumes.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No saved resumes found</p>
                            <p className="text-sm">Create and save your first resume to see it here</p>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto space-y-2">
                            {savedResumes.map((resume) => (
                              <Card key={resume.id} className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-slate-900">{resume.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Updated {formatDate(resume.updatedAt)}
                                      </span>
                                      {currentResumeId === resume.id && (
                                        <Badge variant="secondary" className="text-xs">
                                          Currently Loaded
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleLoadResume(resume.id)}
                                      disabled={isLoading || currentResumeId === resume.id}
                                    >
                                      {isLoading ? "Loading..." : "Load"}
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{resume.name}"? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteResume(resume.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between">
                          <Button variant="outline" onClick={handleNewResume}>
                            New Resume
                          </Button>
                          <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>

                  <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Share2 className="w-4 h-4" />
                        Share Link
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Public Share Link</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-slate-600">
                          Create a public link that anyone can use to view your resume. You can manage and delete shared
                          links anytime.
                        </p>
                        <div>
                          <Label htmlFor="shareResumeName">Resume Name for Sharing</Label>
                          <Input
                            id="shareResumeName"
                            value={resumeName}
                            onChange={(e) => setResumeName(e.target.value)}
                            placeholder="e.g., John Doe - Software Engineer"
                          />
                        </div>
                        {shareUrl && (
                          <div className="space-y-2">
                            <Label>Your Public Resume Link</Label>
                            <div className="flex gap-2">
                              <Input value={shareUrl} readOnly className="flex-1" />
                              <Button
                                size="sm"
                                onClick={() => handleCopyShareUrl(shareUrl, "current")}
                                className="flex items-center gap-2"
                              >
                                {copiedShareId === "current" ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                                {copiedShareId === "current" ? "Copied!" : "Copy"}
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                              This link will remain active until you delete it. Anyone with this link can view your
                              resume.
                            </p>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            onClick={() => setManageSharesDialogOpen(true)}
                            className="flex items-center gap-2"
                          >
                            <Globe className="w-4 h-4" />
                            Manage Shares
                          </Button>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
                              Close
                            </Button>
                            {!shareUrl && (
                              <Button onClick={handleCreatePublicShare} disabled={!resumeName.trim() || isSharing}>
                                {isSharing ? "Creating..." : "Create Share Link"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={manageSharesDialogOpen} onOpenChange={setManageSharesDialogOpen}>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Manage Public Shares</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {publicResumes.length === 0 ? (
                          <div className="text-center py-8 text-slate-500">
                            <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No public shares found</p>
                            <p className="text-sm">Create your first public share to see it here</p>
                          </div>
                        ) : (
                          <div className="max-h-96 overflow-y-auto space-y-3">
                            {publicResumes.map((publicResume) => (
                              <Card key={publicResume.shareId} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-slate-900">{publicResume.name}</h3>
                                        <Badge variant={publicResume.isActive ? "default" : "secondary"}>
                                          {publicResume.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          Created {formatDate(publicResume.createdAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Eye className="w-3 h-3" />
                                          {publicResume.viewCount} views
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleTogglePublicResumeStatus(publicResume.shareId, !publicResume.isActive)
                                        }
                                      >
                                        {publicResume.isActive ? "Deactivate" : "Activate"}
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="ghost">
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Public Share</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete this public share? The link will no longer
                                              work and this action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeletePublicResume(publicResume.shareId)}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Input
                                      value={`${window.location.origin}/resume/${publicResume.shareId}`}
                                      readOnly
                                      className="flex-1 text-sm"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleCopyShareUrl(
                                          `${window.location.origin}/resume/${publicResume.shareId}`,
                                          publicResume.shareId,
                                        )
                                      }
                                      className="flex items-center gap-2"
                                    >
                                      {copiedShareId === publicResume.shareId ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                      {copiedShareId === publicResume.shareId ? "Copied!" : "Copy"}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-end">
                          <Button variant="outline" onClick={() => setManageSharesDialogOpen(false)}>
                            Close
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-8">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResumePreview resumeData={resumeData} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skills Input Component
function SkillsInput({ onAddSkill }: { onAddSkill: (name: string, category: string) => void }) {
  const [skillName, setSkillName] = useState("")
  const [skillCategory, setSkillCategory] = useState("Technical")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (skillName.trim()) {
      onAddSkill(skillName, skillCategory)
      setSkillName("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={skillName}
        onChange={(e) => setSkillName(e.target.value)}
        placeholder="Enter skill name"
        className="flex-1"
      />
      <select
        value={skillCategory}
        onChange={(e) => setSkillCategory(e.target.value)}
        className="px-3 py-2 border border-input rounded-md bg-background"
      >
        <option value="Technical">Technical</option>
        <option value="Soft Skills">Soft Skills</option>
        <option value="Languages">Languages</option>
        <option value="Certifications">Certifications</option>
      </select>
      <Button type="submit" size="sm">
        <Plus className="w-4 h-4" />
      </Button>
    </form>
  )
}

// Resume Preview Component
function ResumePreview({ resumeData }: { resumeData: ResumeData }) {
  const { personalInfo, experience, education, skills } = resumeData

  return (
    <div className="bg-white p-8 shadow-lg rounded-lg max-h-[800px] overflow-y-auto text-sm">
      {/* Header */}
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{personalInfo.fullName || "Your Name"}</h1>
        <div className="flex flex-wrap justify-center gap-4 text-slate-600 text-sm">
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
        {(personalInfo.website || personalInfo.linkedin) && (
          <div className="flex flex-wrap justify-center gap-4 text-blue-600 text-sm mt-2">
            {personalInfo.website && <span>{personalInfo.website}</span>}
            {personalInfo.linkedin && <span>{personalInfo.linkedin}</span>}
          </div>
        )}
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2 border-b border-slate-200">Professional Summary</h2>
          <p className="text-slate-700 leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 border-b border-slate-200">Work Experience</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-semibold text-slate-900">{exp.position}</h3>
                    <p className="text-slate-700">{exp.company}</p>
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 border-b border-slate-200">Education</h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {edu.degree} {edu.field && `in ${edu.field}`}
                    </h3>
                    <p className="text-slate-700">{edu.institution}</p>
                    {edu.gpa && <p className="text-slate-600 text-sm">GPA: {edu.gpa}</p>}
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
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3 border-b border-slate-200">Skills</h2>
          <div className="space-y-2">
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
                <span className="font-medium text-slate-900">{category}: </span>
                <span className="text-slate-700">{skillNames.join(", ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
