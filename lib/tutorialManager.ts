const KEY = 'hydro_tutorial_complete';

export const TutorialManager = {
  isComplete(): boolean {
    if (typeof window === 'undefined') return false;
    // If the key exists, the user has seen the tutorial
    return localStorage.getItem(KEY) === 'true';
  },
  
  setComplete(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY, 'true');
  }
};