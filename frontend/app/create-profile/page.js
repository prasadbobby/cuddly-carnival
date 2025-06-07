// frontend/app/create-profile/page.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '../../lib/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import { validateRequired } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function CreateProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingFocusAreas, setIsGeneratingFocusAreas] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    learning_style: '',
    subject: '',
    custom_subject: '',
    knowledge_level: 1,
    weak_areas: []
  });
  const [customFocusAreas, setCustomFocusAreas] = useState([]);
  const [errors, setErrors] = useState({});

  const learningStyleOptions = [
    { 
      value: 'visual', 
      label: 'Visual Learner',
      description: 'Learn best through images, diagrams, and visual content',
      icon: '👁️'
    },
    { 
      value: 'auditory', 
      label: 'Auditory Learner',
      description: 'Learn best through listening and verbal instruction',
      icon: '👂'
    },
    { 
      value: 'reading', 
      label: 'Reading/Writing',
      description: 'Learn best through text-based content and writing',
      icon: '📚'
    },
    { 
      value: 'kinesthetic', 
      label: 'Kinesthetic Learner',
      description: 'Learn best through hands-on activities and practice',
      icon: '🤲'
    }
  ];

  const subjectOptions = [
    { value: 'algebra', label: 'Algebra', icon: '📐', description: 'Variables, equations, and algebraic structures' },
    { value: 'geometry', label: 'Geometry', icon: '📏', description: 'Shapes, angles, and spatial relationships' },
    { value: 'trigonometry', label: 'Trigonometry', icon: '📊', description: 'Triangles, angles, and trigonometric functions' },
    { value: 'calculus', label: 'Calculus', icon: '∫', description: 'Derivatives, integrals, and advanced mathematics' },
    { value: 'other', label: 'Other Subject', icon: '📝', description: 'Enter a custom subject of your choice' }
  ];

  const weakAreaOptions = {
    algebra: ['variables', 'linear equations', 'like terms', 'order of operations', 'graphing'],
    geometry: ['angles', 'triangles', 'circles', 'area', 'volume'],
    trigonometry: ['sine', 'cosine', 'tangent', 'identities', 'graphs'],
    calculus: ['limits', 'derivatives', 'integrals', 'applications', 'continuity'],
    other: customFocusAreas
  };

  const steps = [
    { id: 1, title: 'Basic Info', icon: '👤' },
    { id: 2, title: 'Learning Style', icon: '🎯' },
    { id: 3, title: 'Subject & Level', icon: '📚' },
    { id: 4, title: 'Focus Areas', icon: '🎪' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const processedValue = name === 'knowledge_level' ? parseInt(value, 10) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear related errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // If subject changes to "other", clear weak areas
    if (name === 'subject' && value === 'other') {
      setFormData(prev => ({
        ...prev,
        weak_areas: []
      }));
    }

    // If subject changes from "other" to something else, clear custom subject
    if (name === 'subject' && value !== 'other') {
      setFormData(prev => ({
        ...prev,
        custom_subject: '',
        weak_areas: []
      }));
      setCustomFocusAreas([]);
    }
  };

  const generateCustomFocusAreas = async () => {
    if (!formData.custom_subject.trim()) {
      toast.error('Please enter a custom subject first');
      return;
    }

    setIsGeneratingFocusAreas(true);
    try {
      console.log('Generating focus areas for:', formData.custom_subject);
      
      const response = await apiClient.generateCustomFocusAreas(formData.custom_subject);
      
      if (response.success && response.focus_areas) {
        setCustomFocusAreas(response.focus_areas);
        toast.success(`Generated ${response.focus_areas.length} focus areas for ${formData.custom_subject}`);
      } else {
        throw new Error(response.error || 'Failed to generate focus areas');
      }
    } catch (error) {
      console.error('Error generating focus areas:', error);
      toast.error('Failed to generate focus areas. Please try again.');
      
      // Fallback: provide some generic focus areas
      const fallbackAreas = [
        'fundamentals',
        'basic concepts',
        'intermediate topics',
        'advanced applications',
        'problem solving'
      ];
      setCustomFocusAreas(fallbackAreas);
      toast.info('Using fallback focus areas');
    } finally {
      setIsGeneratingFocusAreas(false);
    }
  };

  const handleWeakAreaChange = (area) => {
    setFormData(prev => ({
      ...prev,
      weak_areas: prev.weak_areas.includes(area)
        ? prev.weak_areas.filter(item => item !== area)
        : [...prev.weak_areas, area]
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!validateRequired(formData.name)) {
          newErrors.name = 'Name is required';
        }
        break;
      case 2:
        if (!validateRequired(formData.learning_style)) {
          newErrors.learning_style = 'Learning style is required';
        }
        break;
      case 3:
        if (!validateRequired(formData.subject)) {
          newErrors.subject = 'Subject is required';
        }
        if (formData.subject === 'other' && !validateRequired(formData.custom_subject)) {
          newErrors.custom_subject = 'Custom subject name is required';
        }
        if (!formData.knowledge_level || formData.knowledge_level < 1 || formData.knowledge_level > 5) {
          newErrors.knowledge_level = 'Knowledge level must be between 1 and 5';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // If moving to step 4 and subject is "other", generate focus areas automatically
      if (currentStep === 3 && formData.subject === 'other' && customFocusAreas.length === 0) {
        generateCustomFocusAreas();
      }
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting form data:', formData);
      
      const loadingToast = toast.loading('Creating your personalized learning profile...');
      
      // Prepare submission data
      const submissionData = {
        ...formData,
        subject: formData.subject === 'other' ? formData.custom_subject : formData.subject
      };
      
      const response = await apiClient.createLearner(submissionData);
      console.log('Create learner response:', response);
      
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success('Profile created successfully!');
        
        if (response.data.status === 'generating_content') {
          toast.success('AI is generating your personalized content in the background!');
        }
        
        router.push(`/pretest/${response.data.profile_id}`);
      } else {
        throw new Error(response.error || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      if (error.code === 'ECONNABORTED') {
        toast.error('Content generation is taking longer than expected. Please try again.');
      } else {
        toast.error(error.message || 'Failed to create profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-6">
            <span className="text-2xl text-white">🎓</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Learning Profile
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us understand your learning preferences to create the perfect personalized experience
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full text-sm font-bold transition-all duration-300 ${
                  currentStep >= step.id 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? '✓' : step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${
                    currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep - 1].title}
            </h2>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="min-h-[400px]">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="animate-fade-in space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">👋</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let's get started</h3>
                    <p className="text-gray-600">First, tell us a bit about yourself</p>
                  </div>
                  
                  <Input
                    label="What's your name?"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    error={errors.name}
                    className="text-lg py-4"
                  />
                </div>
              )}

              {/* Step 2: Learning Style */}
              {currentStep === 2 && (
                <div className="animate-fade-in space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">How do you learn best?</h3>
                    <p className="text-gray-600">Choose the learning style that resonates with you most</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {learningStyleOptions.map((option) => (
                      <label
                        key={option.value}
                        className={`relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          formData.learning_style === option.value
                            ? 'border-primary-600 bg-primary-50 shadow-lg'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="learning_style"
                          value={option.value}
                          checked={formData.learning_style === option.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-4">
                          <div className="text-3xl">{option.icon}</div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              {option.label}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {option.description}
                            </p>
                          </div>
                        </div>
                        {formData.learning_style === option.value && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                  {errors.learning_style && (
                    <p className="text-sm text-red-600 text-center">{errors.learning_style}</p>
                  )}
                </div>
              )}

              {/* Step 3: Subject and Knowledge Level */}
              {currentStep === 3 && (
                <div className="animate-fade-in space-y-8">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">What would you like to learn?</h3>
                    <p className="text-gray-600">Choose your subject and current knowledge level</p>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-4">Subject</label>
                    <div className="grid md:grid-cols-2 gap-4">
                      {subjectOptions.map((option) => (
                        <label
                          key={option.value}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            formData.subject === option.value
                              ? 'border-primary-600 bg-primary-50 shadow-lg'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="subject"
                            value={option.value}
                            checked={formData.subject === option.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{option.icon}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">{option.label}</h4>
                              <p className="text-sm text-gray-600">{option.description}</p>
                            </div>
                            {formData.subject === option.value && (
                              <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.subject && (
                      <p className="text-sm text-red-600 mt-2">{errors.subject}</p>
                    )}
                  </div>

                  {/* Custom Subject Input */}
                  {formData.subject === 'other' && (
                    <div className="animate-fade-in">
                      <Input
                        label="Enter your custom subject"
                        name="custom_subject"
                        value={formData.custom_subject}
                        onChange={handleInputChange}
                        placeholder="e.g., Physics, Chemistry, History, Programming, etc."
                        required
                        error={errors.custom_subject}
                        className="text-lg py-3"
                      />
                      
                      {formData.custom_subject && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-blue-600">🤖</span>
                            <span className="text-blue-800 font-medium">AI Assistant</span>
                          </div>
                          <p className="text-blue-700 text-sm">
                            Great choice! I'll generate personalized focus areas and create custom assessments for <strong>{formData.custom_subject}</strong> based on your learning style and knowledge level.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-lg font-semibold text-gray-900 mb-4">
                      Current Knowledge Level
                    </label>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <input
                        type="range"
                        name="knowledge_level"
                        min="1"
                        max="5"
                        value={formData.knowledge_level}
                        onChange={handleInputChange}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-3">
                        <span>Beginner</span>
                        <span className="font-semibold text-primary-600 text-lg">
                          Level {formData.knowledge_level}
                        </span>
                        <span>Expert</span>
                      </div>
                      <div className="text-center mt-2">
                        <div className="inline-flex items-center px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                          {formData.knowledge_level === 1 && "Just starting out"}
                          {formData.knowledge_level === 2 && "Some basic knowledge"}
                          {formData.knowledge_level === 3 && "Intermediate understanding"}
                          {formData.knowledge_level === 4 && "Advanced knowledge"}
                          {formData.knowledge_level === 5 && "Expert level"}
                        </div>
                      </div>
                    </div>
                    {errors.knowledge_level && (
                      <p className="text-sm text-red-600 mt-2">{errors.knowledge_level}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Focus Areas */}
              {currentStep === 4 && (
                <div className="animate-fade-in space-y-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Areas to focus on</h3>
                    <p className="text-gray-600">
                      {formData.subject === 'other' 
                        ? `Select topics you'd like to improve in ${formData.custom_subject} (optional)`
                        : 'Select topics you\'d like to improve (optional)'
                      }
                    </p>
                  </div>

                  {/* Custom Subject Focus Areas */}
                  {formData.subject === 'other' && (
                    <div>
                      {customFocusAreas.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-4">🤖</div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">
                            Generate AI Focus Areas
                          </h4>
                          <p className="text-gray-600 mb-6">
                            Let our AI create personalized focus areas for <strong>{formData.custom_subject}</strong>
                          </p>
                          <Button
                            onClick={generateCustomFocusAreas}
                            loading={isGeneratingFocusAreas}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                          >
                            <span className="mr-2">✨</span>
                            {isGeneratingFocusAreas ? 'Generating Focus Areas...' : 'Generate Focus Areas'}
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              AI-Generated Focus Areas for {formData.custom_subject}
                            </h4>
                            <Button
                              onClick={generateCustomFocusAreas}
                              loading={isGeneratingFocusAreas}
                              variant="outline"
                              size="sm"
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <span className="mr-1">🔄</span>
                              Regenerate
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {customFocusAreas.map((area, index) => (
                              <label
                                key={index}
                                className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                                  formData.weak_areas.includes(area)
                                    ? 'border-primary-600 bg-primary-50 shadow-lg'
                                    : 'border-gray-200 hover:border-primary-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.weak_areas.includes(area)}
                                  onChange={() => handleWeakAreaChange(area)}
                                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                  {area}
                                </span>
                              </label>
                            ))}
                          </div>
                          
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">🤖</span>
                              <span className="text-green-800 font-medium">AI Generated</span>
                            </div>
                            <p className="text-green-700 text-sm mt-1">
                              These focus areas were automatically generated based on your subject and knowledge level.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Standard Subject Focus Areas */}
                  {formData.subject && formData.subject !== 'other' && weakAreaOptions[formData.subject] && (
                    <div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {weakAreaOptions[formData.subject].map((area) => (
                          <label
                            key={area}
                            className={`flex items-center space-x-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg ${
                              formData.weak_areas.includes(area)
                                ? 'border-primary-600 bg-primary-50 shadow-lg'
                                : 'border-gray-200 hover:border-primary-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.weak_areas.includes(area)}
                              onChange={() => handleWeakAreaChange(area)}
                              className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {area}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Focus Areas Display */}
                  {formData.weak_areas.length > 0 && (
                    <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
                      <h4 className="font-medium text-primary-900 mb-2">Selected focus areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.weak_areas.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-primary-600 text-white rounded-full text-sm font-medium"
                          >
                            {area}
                            <button
                              type="button"
                              onClick={() => handleWeakAreaChange(area)}
                              className="ml-2 hover:bg-primary-700 rounded-full p-0.5"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What happens next section */}
                  <div className="bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">🚀</div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          What happens next?
                        </h4>
                        <div className="space-y-2 text-sm text-gray-700">
                          {formData.subject === 'other' ? (
                            <>
                              <p>• Take a custom AI-powered assessment for <strong>{formData.custom_subject}</strong></p>
                              <p>• Get a personalized learning path with AI-generated content</p>
                              <p>• Learn with adaptive materials tailored to your custom subject</p>
                            </>
                          ) : (
                            <>
                              <p>• Take a quick AI-powered assessment to evaluate your current knowledge</p>
                              <p>• Get a personalized learning path designed specifically for you</p>
                              <p>• Start learning with adaptive content that evolves with your progress</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={currentStep === 1 ? () => router.back() : handlePrevious}
                className="px-6 py-3"
              >
                {currentStep === 1 ? 'Back to Home' : 'Previous'}
              </Button>

              <div className="flex space-x-3">
                {currentStep < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3"
                    style={{ backgroundColor: '#8700e2' }}
                    disabled={currentStep === 3 && formData.subject === 'other' && !formData.custom_subject}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    loading={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    Create Profile & Start Assessment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}