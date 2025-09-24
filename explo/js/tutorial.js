/**
 * Tutorial system for the Tower Defense game
 */
class TutorialSystem {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 12; // Updated with new steps for loadout, gacha, etc.
    this.tutorialOverlay = document.getElementById('tutorial-overlay');

    // Check if tutorial overlay exists
    if (!this.tutorialOverlay) {
      console.error('Tutorial overlay not found');
      return;
    }

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
    // Check if progress container exists
    if (!this.progressContainer) {
      console.error('Tutorial progress container not found');
      return;
    }

    // Clear existing dots
    this.progressContainer.innerHTML = '';

    // Create dots for each step
    for (let i = 1; i <= this.totalSteps; i++) {
      const dot = document.createElement('div');
      dot.classList.add('tutorial-dot');
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
    const nextButton = document.getElementById('tutorial-next');
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        this.nextStep();
      });
    } else {
      console.error('Tutorial next button not found');
    }

    // Previous button
    const prevButton = document.getElementById('tutorial-prev');
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        this.prevStep();
      });
    } else {
      console.error('Tutorial prev button not found');
    }

    // Skip button
    const skipButton = document.getElementById('tutorial-skip');
    if (skipButton) {
      skipButton.addEventListener('click', () => {
        this.completeTutorial();
      });
    } else {
      console.error('Tutorial skip button not found');
    }

    // Close button
    const closeButton = document.getElementById('tutorial-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.completeTutorial();
      });
    } else {
      console.error('Tutorial close button not found');
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.tutorialOverlay || !this.tutorialOverlay.classList.contains('active')) return;

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
    if (!this.tutorialOverlay) {
      console.error('Tutorial overlay not found');
      return;
    }

    // Show the tutorial overlay
    this.tutorialOverlay.style.display = 'flex';
    this.goToStep(1);

    // Pause the game if it's running
    if (window.game && !window.game.paused) {
      window.game.paused = true;
    }
  }

  // Hide tutorial
  hideTutorial() {
    if (!this.tutorialOverlay) {
      console.error('Tutorial overlay not found');
      return;
    }

    // Hide the tutorial overlay
    this.tutorialOverlay.style.display = 'none';

    // Resume the game if it was paused
    if (window.game && window.game.paused) {
      window.game.paused = false;
    }
  }

  // Go to specific step
  goToStep(step) {
    if (step < 1 || step > this.totalSteps) return;

    // Hide all steps
    if (this.tutorialSteps && this.tutorialSteps.length > 0) {
      this.tutorialSteps.forEach(stepEl => {
        stepEl.classList.remove('active');
      });
    }

    // Show current step
    const currentStepEl = document.querySelector(`.tutorial-step[data-step="${step}"]`);
    if (currentStepEl) {
      currentStepEl.classList.add('active');
    } else {
      console.error(`Tutorial step ${step} not found`);
    }

    // Update progress dots
    if (this.progressContainer) {
      const dots = this.progressContainer.querySelectorAll('.tutorial-dot');
      dots.forEach(dot => {
        dot.classList.remove('active');
        if (parseInt(dot.dataset.step) === step) {
          dot.classList.add('active');
        }
      });
    }

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

    // Check if buttons exist
    if (!prevBtn || !nextBtn) {
      console.error('Tutorial buttons not found');
      return;
    }

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
