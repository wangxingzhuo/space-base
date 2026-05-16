import React from 'react';

interface IVideoPlayerProps {
  videoRes: string;
}

export default function VideoPlayer(props: IVideoPlayerProps) {
  const { videoRes } = props;

  const handleFullScreen = (ev: Event) => {};

  return (
    <div className="video-player">
      <video src="videoRes" />
      <div className="ctrl-bar">
        <button className="play-pause"></button>
        {/* <process className="play-pause" />
        <vol /> */}
        <button className="setting"></button>
      </div>
    </div>
  );
}
