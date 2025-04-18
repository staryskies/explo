/**
 * Tutorial system for the Tower Defense game
 */
class TutorialSystem {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 7; // Update this if you add more steps
    this.tutorialOverlay = document.getElementById('tutorial-overlay');
    this.tutorialSteps = document.querySelectorAll('.tutorial-step');
    this.progressContainer = document.getElementById('tutorial-progress');
    
    // Initialize progress dots
    this.initProgressDots();
    
    // Initialize event listeners
    this.initEventListeners();
    
    // Check if tutorial has been completed before
    this.checkTutorialStatus();
  }
  
  // Initialize progress dots
  initProgressDots() {
    // Clear existing dots
    this.progressContainer.innerHTML = '';
    
    // Create dots for each step
    for (let i = 1; i <= this.totalSteps; i++) {
      const dot = document.createElement('div');
      dot.classList.add('progress-dot');
      if (i === this.currentStep) {
        dot.classList.add('active');
      }
      dot.dataset.step = i;
      dot.addEventListener('click', () => this.goToStep(i));
      this.progressContainer.appendChild(dot);
    }
  }
  
  // Initialize event listeners
  initEventListeners() {
    // Next button
    document.getElementById('tutorial-next').addEventListener('click', () => {
      this.nextStep();
    });
    
    // Previous button
    document.getElementById('tutorial-prev').addEventListener('click', () => {
      this.prevStep();
    });
    
    // Skip button
    document.getElementById('tutorial-skip').addEventListener('click', () => {
      this.completeTutorial();
    });
    
    // Close button
    document.getElementById('tutorial-close').addEventListener('click', () => {
      this.completeTutorial();
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.tutorialOverlay.classList.contains('active')) return;
      
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        this.nextStep();
      } else if (e.key === 'ArrowLeft') {
        this.prevStep();
      } else if (e.key === 'Escape') {
        this.completeTutorial();
      }
    });
  }
  
  // Check if tutorial has been completed before
  checkTutorialStatus() {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    
    if (!tutorialCompleted) {
      // Show tutorial if it hasn't been completed
      this.showTutorial();
    }
  }
  
  // Show tutorial
  showTutorial() {
    this.tutorialOverlay.classList.add('active');
    this.goToStep(1);
    
    // Pause the game if it's running
    if (window.game && !window.game.paused) {
      window.game.paused = true;
    }
  }
  
  // Hide tutorial
  hideTutorial() {
    this.tutorialOverlay.classList.remove('active');
    
    // Resume the game if it was paused
    if (window.game && window.game.paused) {
      window.game.paused = false;
    }
  }
  
  // Go to specific step
  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;
    
    // Hide all steps
    this.tutorialSteps.forEach(stepEl => {
      stepEl.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.querySelector(`.tutorial-step[data-step="${step}"]`);
    if (currentStepEl) {
      currentStepEl.classList.add('active');
    }
    
    // Update progress dots
    const dots = this.progressContainer.querySelectorAll('.progress-dot');
    dots.forEach(dot => {
      dot.classList.remove('active');
      if (parseInt(dot.dataset.step) === step) {
        dot.classList.add('active');
      }
    });
    
    // Update current step
    this.currentStep = step;
    
    // Update button states
    this.updateButtonStates();
  }
  
  // Next step
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.goToStep(this.currentStep + 1);
    } else {
      this.completeTutorial();
    }
  }
  
  // Previous step
  prevStep() {
    if (this.currentStep > 1) {
      this.goToStep(this.currentStep - 1);
    }
  }
  
  // Update button states
  updateButtonStates() {
    const prevBtn = document.getElementById('tutorial-prev');
    const nextBtn = document.getElementById('tutorial-next');
    
    // Disable previous button on first step
    prevBtn.disabled = this.currentStep === 1;
    
    // Change next button text on last step
    if (this.currentStep === this.totalSteps) {
      nextBtn.textContent = 'Finish';
    } else {
      nextBtn.textContent = 'Next';
    }
  }
  
  // Complete tutorial
  completeTutorial() {
    // Mark tutorial as completed
    localStorage.setItem('tutorialCompleted', 'true');
    
    // Hide tutorial
    this.hideTutorial();
  }
  
  // Reset tutorial (for testing)
  resetTutorial() {
    localStorage.removeItem('tutorialCompleted');
  }
  
  // Show tutorial again (manual trigger)
  showTutorialAgain() {
    this.showTutorial();
  }
}

// Initialize tutorial system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Create global tutorial instance
  window.tutorialSystem = new TutorialSystem();
});
