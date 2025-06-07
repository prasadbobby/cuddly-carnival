export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getScoreColor = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

export const getLearningStyleName = (style) => {
  const styles = {
    visual: 'Visual',
    auditory: 'Auditory',
    reading: 'Reading/Writing',
    kinesthetic: 'Kinesthetic'
  };
  return styles[style] || 'Universal';
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};