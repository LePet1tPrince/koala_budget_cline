import { useEffect, useState } from 'react';

import { NotificationStyles as styles } from '../../styles/modules';

const Notification = ({ message, type = 'info', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message) return;

    // Set a timeout to automatically close the notification
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    // Clean up the timer when the component unmounts
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message || !isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      default:
        return styles.info;
    }
  };

  return (
    <div className={`${styles.notification} ${getTypeClass()}`}>
      <div className={styles.content}>
        {type === 'success' && <span className={styles.icon}>✓</span>}
        {type === 'error' && <span className={styles.icon}>✗</span>}
        {type === 'warning' && <span className={styles.icon}>⚠</span>}
        {type === 'info' && <span className={styles.icon}>ℹ</span>}
        <p>{message}</p>
      </div>
      <button className={styles.closeButton} onClick={handleClose}>
        ×
      </button>
    </div>
  );
};

export default Notification;
