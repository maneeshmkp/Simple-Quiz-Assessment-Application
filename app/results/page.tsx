"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Mail, RotateCcw, Download, Trophy, Target, Timer, Award } from "lucide-react"

interface QuizResults {
  questions: Array<{
    id: number
    question: string
    choices: string[]
    correct_answer: string
  }>
  answers: { [key: number]: string }
  timeSpent: number
}

export default function ResultsPage() {
  const [results, setResults] = useState<QuizResults | null>(null)
  const [email, setEmail] = useState("")
  const [showAnimation, setShowAnimation] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const storedResults = localStorage.getItem("quizResults")
    const storedEmail = localStorage.getItem("quizEmail")

    if (!storedResults || !storedEmail) {
      router.push("/")
      return
    }

    setResults(JSON.parse(storedResults))
    setEmail(storedEmail)

    // Trigger animation after component mounts
    setTimeout(() => setShowAnimation(true), 100)
  }, [router])

  const calculateScore = () => {
    if (!results) return { correct: 0, total: 0, percentage: 0 }

    let correct = 0
    results.questions.forEach((question, index) => {
      if (results.answers[index] === question.correct_answer) {
        correct++
      }
    })

    return {
      correct,
      total: results.questions.length,
      percentage: Math.round((correct / results.questions.length) * 100),
    }
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: "Excellent", color: "text-green-600", bg: "bg-green-50", icon: Trophy }
    if (percentage >= 80) return { level: "Very Good", color: "text-blue-600", bg: "bg-blue-50", icon: Award }
    if (percentage >= 70) return { level: "Good", color: "text-purple-600", bg: "bg-purple-50", icon: Target }
    if (percentage >= 60) return { level: "Fair", color: "text-yellow-600", bg: "bg-yellow-50", icon: Target }
    return { level: "Needs Improvement", color: "text-red-600", bg: "bg-red-50", icon: Target }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const handleRetakeQuiz = () => {
    localStorage.removeItem("quizResults")
    localStorage.removeItem("quizEmail")
    localStorage.removeItem("quizStartTime")
    router.push("/")
  }

  const handleDownloadResults = () => {
    if (!results) return

    const score = calculateScore()
    const performance = getPerformanceLevel(score.percentage)

    const reportData = {
      platform: "QuizSphere",
      email,
      score: `${score.correct}/${score.total} (${score.percentage}%)`,
      performance: performance.level,
      timeSpent: formatTime(results.timeSpent),
      completedAt: new Date().toLocaleString(),
      questions: results.questions.map((q, index) => ({
        question: q.question,
        userAnswer: results.answers[index] || "Not answered",
        correctAnswer: q.correct_answer,
        isCorrect: results.answers[index] === q.correct_answer,
      })),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `quizsphere-results-${email.replace("@", "-")}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading Results...</p>
        </div>
      </div>
    )
  }

  const score = calculateScore()
  const performance = getPerformanceLevel(score.percentage)
  const PerformanceIcon = performance.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <Card
          className={`mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-2xl transition-all duration-1000 ${
            showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div
                className={`p-4 rounded-full ${performance.bg} transition-all duration-500 ${
                  showAnimation ? "scale-100" : "scale-0"
                }`}
              >
                <PerformanceIcon className={`w-12 h-12 ${performance.color}`} />
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">QuizSphere Assessment Complete!</CardTitle>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
              <Mail className="w-4 h-4" />
              <span className="font-medium">{email}</span>
            </div>
            <Badge className={`${performance.bg} ${performance.color} border-0 px-4 py-2 text-lg font-medium`}>
              {performance.level}
            </Badge>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div
                className={`text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 transition-all duration-700 ${
                  showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: "200ms" }}
              >
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {score.correct}/{score.total}
                </div>
                <div className="text-sm text-gray-600 font-medium">Questions Correct</div>
              </div>

              <div
                className={`text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 transition-all duration-700 ${
                  showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: "400ms" }}
              >
                <div className="text-3xl font-bold text-green-600 mb-2">{score.percentage}%</div>
                <div className="text-sm text-gray-600 font-medium">Overall Score</div>
              </div>

              <div
                className={`text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 transition-all duration-700 ${
                  showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: "600ms" }}
              >
                <div className="text-3xl font-bold text-purple-600 mb-2 flex items-center justify-center gap-1">
                  <Timer className="w-6 h-6" />
                  {formatTime(results.timeSpent)}
                </div>
                <div className="text-sm text-gray-600 font-medium">Time Spent</div>
              </div>

              <div
                className={`text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 transition-all duration-700 ${
                  showAnimation ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: "800ms" }}
              >
                <div className="text-3xl font-bold text-orange-600 mb-2">{Object.keys(results.answers).length}</div>
                <div className="text-sm text-gray-600 font-medium">Questions Attempted</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleDownloadResults}
                variant="outline"
                className="h-12 px-6 border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:shadow-md bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Results
              </Button>
              <Button
                onClick={handleRetakeQuiz}
                className="h-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Assessment
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Detailed Review
          </h2>

          {results.questions.map((question, index) => {
            const userAnswer = results.answers[index]
            const isCorrect = userAnswer === question.correct_answer
            const wasAnswered = userAnswer !== undefined

            return (
              <Card
                key={index}
                className={`border-l-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg transition-all duration-500 hover:shadow-xl ${
                  !wasAnswered ? "border-l-gray-400" : isCorrect ? "border-l-green-500" : "border-l-red-500"
                } ${showAnimation ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg flex items-start gap-3 flex-1">
                      <span className="text-gray-500 font-medium min-w-[3rem]">Q{index + 1}.</span>
                      <span className="leading-relaxed">{question.question}</span>
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!wasAnswered ? (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                          Not Answered
                        </Badge>
                      ) : isCorrect ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <XCircle className="w-3 h-3 mr-1" />
                          Incorrect
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    {question.choices.map((choice, choiceIndex) => {
                      const isUserChoice = choice === userAnswer
                      const isCorrectChoice = choice === question.correct_answer
                      const optionLabel = String.fromCharCode(65 + choiceIndex)

                      return (
                        <div
                          key={choiceIndex}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isCorrectChoice
                              ? "bg-green-50 border-green-200 shadow-sm"
                              : isUserChoice && !isCorrectChoice
                                ? "bg-red-50 border-red-200 shadow-sm"
                                : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                  isCorrectChoice
                                    ? "border-green-500 bg-green-500 text-white"
                                    : isUserChoice && !isCorrectChoice
                                      ? "border-red-500 bg-red-500 text-white"
                                      : "border-gray-300 bg-white text-gray-600"
                                }`}
                              >
                                {optionLabel}
                              </div>
                              <span className="leading-relaxed">{choice}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isUserChoice && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  Your Answer
                                </Badge>
                              )}
                              {isCorrectChoice && (
                                <Badge className="bg-green-600 text-white text-xs">Correct Answer</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
