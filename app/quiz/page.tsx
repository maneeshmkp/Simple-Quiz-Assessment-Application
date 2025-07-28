"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Circle } from "lucide-react"

interface Question {
  id: number
  question: string
  choices: string[]
  correct_answer: string
}

interface QuizState {
  questions: Question[]
  currentQuestion: number
  answers: { [key: number]: string }
  timeLeft: number
  questionStatus: { [key: number]: "not-visited" | "visited" | "answered" }
}

export default function QuizPage() {
  const router = useRouter()
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    currentQuestion: 0,
    answers: {},
    timeLeft: 30 * 60, // 30 minutes in seconds
    questionStatus: {},
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  // Fetch questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch("https://opentdb.com/api.php?amount=15&type=multiple")
        const data = await response.json()

        const formattedQuestions: Question[] = data.results.map((q: any, index: number) => ({
          id: index,
          question: decodeHTMLEntities(q.question),
          choices: [...q.incorrect_answers, q.correct_answer]
            .map((choice) => decodeHTMLEntities(choice))
            .sort(() => Math.random() - 0.5), // Shuffle choices
          correct_answer: decodeHTMLEntities(q.correct_answer),
        }))

        const initialStatus: { [key: number]: "not-visited" | "visited" | "answered" } = {}
        formattedQuestions.forEach((_, index) => {
          initialStatus[index] = index === 0 ? "visited" : "not-visited"
        })

        setQuizState((prev) => ({
          ...prev,
          questions: formattedQuestions,
          questionStatus: initialStatus,
        }))
        setIsLoading(false)
      } catch (error) {
        console.error("Failed to fetch questions:", error)
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [])

  // Timer effect
  useEffect(() => {
    if (quizState.timeLeft <= 0) {
      handleSubmitQuiz()
      return
    }

    const timer = setInterval(() => {
      setQuizState((prev) => ({
        ...prev,
        timeLeft: prev.timeLeft - 1,
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [quizState.timeLeft])

  const decodeHTMLEntities = (text: string) => {
    const textarea = document.createElement("textarea")
    textarea.innerHTML = text
    return textarea.value
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (answer: string) => {
    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [prev.currentQuestion]: answer,
      },
      questionStatus: {
        ...prev.questionStatus,
        [prev.currentQuestion]: "answered",
      },
    }))
  }

  const navigateToQuestion = async (questionIndex: number) => {
    if (questionIndex === quizState.currentQuestion) return

    setIsTransitioning(true)

    // Small delay for smooth transition
    await new Promise((resolve) => setTimeout(resolve, 150))

    setQuizState((prev) => ({
      ...prev,
      currentQuestion: questionIndex,
      questionStatus: {
        ...prev.questionStatus,
        [questionIndex]:
          prev.questionStatus[questionIndex] === "not-visited" ? "visited" : prev.questionStatus[questionIndex],
      },
    }))

    setIsTransitioning(false)
  }

  const handleSubmitQuiz = () => {
    // Store quiz results in localStorage
    localStorage.setItem(
      "quizResults",
      JSON.stringify({
        questions: quizState.questions,
        answers: quizState.answers,
        timeSpent: 30 * 60 - quizState.timeLeft,
      }),
    )
    router.push("/results")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400 mx-auto"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading QuizSphere Assessment...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your questions</p>
        </div>
      </div>
    )
  }

  const currentQ = quizState.questions[quizState.currentQuestion]
  const progress = ((quizState.currentQuestion + 1) / quizState.questions.length) * 100
  const answeredCount = Object.keys(quizState.answers).length
  const isTimeRunningOut = quizState.timeLeft <= 300 // 5 minutes

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">QuizSphere Assessment</h1>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Question {quizState.currentQuestion + 1} of {quizState.questions.length}
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">
                  {answeredCount}/{quizState.questions.length} Answered
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  isTimeRunningOut ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"
                }`}
              >
                <Clock className={`w-4 h-4 ${isTimeRunningOut ? "animate-pulse" : ""}`} />
                <span className="font-mono text-lg font-medium">{formatTime(quizState.timeLeft)}</span>
                {isTimeRunningOut && <AlertTriangle className="w-4 h-4 animate-pulse" />}
              </div>

              {/* Submit Test Button */}
              <Button
                onClick={() => setShowSubmitDialog(true)}
                variant="outline"
                className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-700 hover:from-red-100 hover:to-orange-100 hover:border-red-300 font-medium px-4 py-2 transition-all duration-200 hover:shadow-md"
              >
                Submit Test
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="xl:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Circle className="w-5 h-5 text-blue-600" />
                  Question Navigator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 xl:grid-cols-3 gap-2">
                  {quizState.questions.map((_, index) => {
                    const status = quizState.questionStatus[index]
                    const isActive = index === quizState.currentQuestion

                    return (
                      <Button
                        key={index}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => navigateToQuestion(index)}
                        className={`relative h-10 transition-all duration-200 ${
                          isActive
                            ? "bg-blue-600 hover:bg-blue-700 shadow-lg scale-105"
                            : status === "answered"
                              ? "border-green-500 bg-green-50 hover:bg-green-100 text-green-700"
                              : status === "visited"
                                ? "border-yellow-500 bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                                : "hover:bg-gray-50"
                        }`}
                      >
                        {index + 1}
                        {status === "answered" && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                        {status === "visited" && status !== "answered" && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white"></div>
                        )}
                      </Button>
                    )
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600">Visited</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-600">Not Visited</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Content */}
          <div className="xl:col-span-3">
            <Card
              className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg transition-all duration-300 ${
                isTransitioning ? "opacity-50 scale-[0.98]" : "opacity-100 scale-100"
              }`}
            >
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl font-semibold text-gray-900 leading-relaxed">
                    Question {quizState.currentQuestion + 1}
                  </CardTitle>
                  <Badge
                    variant={quizState.answers[quizState.currentQuestion] ? "default" : "secondary"}
                    className={quizState.answers[quizState.currentQuestion] ? "bg-green-100 text-green-800" : ""}
                  >
                    {quizState.answers[quizState.currentQuestion] ? "Answered" : "Not Answered"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-lg text-gray-800 leading-relaxed font-medium">{currentQ?.question}</p>
                </div>

                <div className="space-y-3">
                  {currentQ?.choices.map((choice, index) => {
                    const isSelected = quizState.answers[quizState.currentQuestion] === choice
                    const optionLabel = String.fromCharCode(65 + index) // A, B, C, D

                    return (
                      <label
                        key={index}
                        className={`group flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                              isSelected
                                ? "border-blue-500 bg-blue-500 text-white"
                                : "border-gray-300 group-hover:border-gray-400"
                            }`}
                          >
                            {isSelected ? "✓" : optionLabel}
                          </div>
                          <input
                            type="radio"
                            name="answer"
                            value={choice}
                            checked={isSelected}
                            onChange={(e) => handleAnswerSelect(e.target.value)}
                            className="sr-only"
                          />
                        </div>
                        <span className="flex-1 text-gray-800 leading-relaxed">{choice}</span>
                      </label>
                    )
                  })}
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => navigateToQuestion(Math.max(0, quizState.currentQuestion - 1))}
                    disabled={quizState.currentQuestion === 0 || isTransitioning}
                    className="flex items-center gap-2 h-11 px-6 transition-all duration-200 hover:shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    {quizState.currentQuestion === quizState.questions.length - 1 ? (
                      <Button
                        onClick={handleSubmitQuiz}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-11 px-8 font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        Submit Assessment
                      </Button>
                    ) : (
                      <Button
                        onClick={() =>
                          navigateToQuestion(Math.min(quizState.questions.length - 1, quizState.currentQuestion + 1))
                        }
                        disabled={isTransitioning}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11 px-6 font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-fade-in-up">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Submit Assessment?</h3>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to submit your QuizSphere assessment? This action cannot be undone.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Questions Answered:</span>
                    <span className="font-medium text-gray-900">
                      {answeredCount} of {quizState.questions.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time Remaining:</span>
                    <span className="font-medium text-gray-900">{formatTime(quizState.timeLeft)}</span>
                  </div>
                  {answeredCount < quizState.questions.length && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded p-2 mt-3">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{quizState.questions.length - answeredCount} question(s) will be marked as unanswered</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSubmitDialog(false)}
                  variant="outline"
                  className="flex-1 h-11 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmitDialog(false)
                    handleSubmitQuiz()
                  }}
                  className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium"
                >
                  Yes, Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
