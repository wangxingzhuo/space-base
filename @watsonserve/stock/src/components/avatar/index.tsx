import { useState, useEffect } from 'react';
import classes from './style.module.styl';

interface IProps {
  src?: string;
  alt?: string;
}

function loadImg(src: string) {
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`img reload failed: ${src}`));
    img.src = src;
  });
}

export default function(props: IProps) {
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    props.src && loadImg(props.src).then(setImgSrc, () => undefined);
  }, []);

  return (
    <div className={classes.avatar}>
      {imgSrc ? <img src={imgSrc} /> : <span>{ props.alt?.toUpperCase() }</span>}
    </div>
  );
}
