import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="fas fa-eye text-primary text-2xl mr-3"></i>
                <h1 className="text-xl font-semibold text-gray-900">CivicLens AI</h1>
              </div>
            </div>
            <div className="flex items-center">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-primary text-white hover:bg-primary/90"
                data-testid="button-login"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-hero-title">
              Smart Civic Issue Reporting
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100" data-testid="text-hero-subtitle">
              Upload a photo, let AI detect the issue, and automatically route it to the right department
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
                data-testid="button-get-started"
              >
                <i className="fas fa-camera mr-2"></i>
                Get Started
              </Button>
              <Button 
                variant="outline"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-colors duration-200"
                data-testid="button-learn-more"
              >
                <i className="fas fa-info-circle mr-2"></i>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-features-title">
              How CivicLens AI Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Revolutionary AI-powered platform making civic engagement easier and more effective
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors" data-testid="card-feature-upload">
              <CardContent className="pt-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-camera text-primary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">1. Upload Photo</h3>
                <p className="text-gray-600">
                  Simply take a photo of any civic issue - potholes, graffiti, broken streetlights, or trash overflow
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors" data-testid="card-feature-ai">
              <CardContent className="pt-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-robot text-secondary text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">2. AI Analysis</h3>
                <p className="text-gray-600">
                  Our advanced AI automatically detects issue type, severity, and generates detailed reports
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 border-2 hover:border-primary/20 transition-colors" data-testid="card-feature-routing">
              <CardContent className="pt-6">
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-route text-orange-600 text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">3. Auto-Routing</h3>
                <p className="text-gray-600">
                  Reports are automatically sent to the correct city department for quick resolution
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-stats-title">
              Making Cities Smarter
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center" data-testid="stat-accuracy">
              <div className="text-4xl font-bold text-primary mb-2">95%</div>
              <div className="text-gray-600">AI Accuracy</div>
            </div>
            <div className="text-center" data-testid="stat-response">
              <div className="text-4xl font-bold text-primary mb-2">2.1</div>
              <div className="text-gray-600">Avg Response Days</div>
            </div>
            <div className="text-center" data-testid="stat-reduction">
              <div className="text-4xl font-bold text-primary mb-2">70%</div>
              <div className="text-gray-600">Time Reduction</div>
            </div>
            <div className="text-center" data-testid="stat-satisfaction">
              <div className="text-4xl font-bold text-primary mb-2">90%</div>
              <div className="text-gray-600">User Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4" data-testid="text-cta-title">
            Ready to Improve Your Community?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of citizens making their communities better, one report at a time.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="bg-white text-primary px-8 py-3 text-lg font-semibold hover:bg-gray-50 transition-colors duration-200"
            data-testid="button-join-now"
          >
            <i className="fas fa-user-plus mr-2"></i>
            Join CivicLens AI
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <i className="fas fa-eye text-primary text-2xl mr-3"></i>
                <h3 className="text-xl font-bold text-white">CivicLens AI</h3>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Empowering citizens and cities with AI-powered civic infrastructure reporting. 
                Making communities safer and more responsive, one report at a time.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">For Citizens</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">For Officials</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">API Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">© 2025 CivicLens AI. All rights reserved.</p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <span className="text-sm text-gray-400">Powered by</span>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>OpenAI Vision</span>
                  <span>•</span>
                  <span>Open311 API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
