import EducationComponent from '~/components/myComponents/EducationComponent';
import '../../education.css';
import { useEffect } from 'react';
import MainFooter from '~/components/myComponents/MainFooter';

function education() {
  useEffect(() => {
    document.title = 'Renaissance - Education';
  }, []);

  return (
    <div>
      <EducationComponent />
    </div>
  );
}

export default education;
