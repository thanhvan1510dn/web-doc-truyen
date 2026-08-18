import { useState, useEffect } from 'react';

export function useReadingProgress() {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    const updateScrollCompletion = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const percent = Math.min(100, Math.max(0, Math.round((currentProgress / scrollHeight) * 100)));
        setCompletion(percent);
      } else {
        setCompletion(100);
      }
    };

    window.addEventListener('scroll', updateScrollCompletion);
    updateScrollCompletion();

    return () => {
      window.removeEventListener('scroll', updateScrollCompletion);
    };
  }, []);

  return completion;
}
