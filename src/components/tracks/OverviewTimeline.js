import React, { memo, useState } from 'react';
import { useLocation } from '@reach/router';
import cn from 'classnames';
import { Link } from 'gatsby';

import { usePersistScrollPosition } from '../../hooks';

import * as css from './OverviewTimeline.module.css';

const usePaths = (chapters, track, trackPosition) => {
  const flatTrack = chapters
    .flatMap((chapter) => chapter.videos)
    .flatMap((video) =>
      video.parts?.length > 0
        ? video.parts.map((_, partIndex) => ({ slug: video.slug, partIndex }))
        : [{ slug: video.slug, partIndex: 0 }]
    );
  const { state } = useLocation();
  const partIndex = state?.challengePartIndex ?? 0;
  const currentVideo =
    chapters[trackPosition.chapterIndex].videos[trackPosition.videoIndex];
  const currentIndex = flatTrack.findIndex(
    (video) => video.slug === currentVideo.slug && video.partIndex === partIndex
  );
  const prevVideo = flatTrack[currentIndex - 1];
  const nextVideo = flatTrack[currentIndex + 1];
  const prev = prevVideo
    ? {
        path: `/tracks/${track.slug}/${prevVideo.slug}`,
        partIndex: prevVideo.partIndex
      }
    : null;
  const next = nextVideo
    ? {
        path: `/tracks/${track.slug}/${nextVideo.slug}`,
        partIndex: nextVideo.partIndex
      }
    : null;
  return [prev, next];
};

const OverviewTimeline = memo(
  ({ className, chapters, track, trackPosition }) => {
    const [previousVideo, nextVideo] = usePaths(chapters, track, trackPosition);

    const timelineRef = usePersistScrollPosition(track.slug, 'tracks');
    return (
      <div className={cn(css.root, className)}>
        <div className={css.overviewTimeline} ref={timelineRef}>
          {chapters.map((chapter, index) => (
            <ChapterSection
              key={index}
              chapter={chapter}
              chapterIndex={index}
              chapters={chapters}
              track={track}
              trackPosition={trackPosition}
            />
          ))}
        </div>
        <div className={css.navigation}>
          {previousVideo !== null && (
            <Link
              className={css.navButton}
              to={previousVideo.path}
              state={{ challengePartIndex: previousVideo.partIndex }}>
              Previous
            </Link>
          )}
          {nextVideo !== null && (
            <Link
              className={css.navButton}
              to={nextVideo.path}
              state={{ challengePartIndex: nextVideo.partIndex }}>
              Next
            </Link>
          )}
        </div>
      </div>
    );
  }
);

const ChapterSection = memo(
  ({ chapter, chapterIndex, chapters, track, trackPosition }) => {
    const hasSeenChapter = chapterIndex < trackPosition.chapterIndex;
    const isThisChapter = chapterIndex === trackPosition.chapterIndex;
    const trackPath = `/tracks/${track.slug}`;
    const [collapsed, setCollapsed] = useState(false);

    const { videoIndex: currentVideoIndex } = trackPosition;
    // This `state` variable is populated through a `Link` in this component
    const { state } = useLocation();
    const currentPartIndex = state?.challengePartIndex ?? 0;

    return (
      <ul className={css.chapterList}>
        {chapter.title && (
          <li>
            <button
              className={cn(
                css.chapterTitle,
                { [css.expanded]: !collapsed },
                { [css.hasSeen]: hasSeenChapter || isThisChapter }
              )}
              onClick={() => setCollapsed((c) => !c)}>
              {chapter.title}
            </button>
          </li>
        )}
        {!collapsed &&
          chapter.videos.map((video, videoIndex) => {
            const hasSeenVideo =
              hasSeenChapter ||
              (isThisChapter && videoIndex <= currentVideoIndex);
            const isLastVideo =
              (hasSeenChapter &&
                videoIndex === chapters[chapterIndex].videos.length - 1) ||
              (isThisChapter && videoIndex === currentVideoIndex);
            const isMultiPart = video.parts?.length > 0;

            return isMultiPart ? (
              video.parts.map((part, partIndex) => {
                const hasSeenPart =
                  hasSeenVideo &&
                  (videoIndex < currentVideoIndex ||
                    partIndex <= currentPartIndex);
                return (
                  <li
                    key={`${video.slug}-${partIndex}`}
                    className={cn(css.videoItem, {
                      [css.seen]: hasSeenPart,
                      [css.last]: isLastVideo && partIndex === currentPartIndex
                    })}>
                    <Link
                      to={`${trackPath}/${video.slug}`}
                      state={{ challengePartIndex: partIndex }}>
                      {video.title} - Part {partIndex + 1}
                    </Link>
                  </li>
                );
              })
            ) : (
              <li
                key={video.slug}
                className={cn(css.videoItem, {
                  [css.seen]: hasSeenVideo,
                  [css.last]: isLastVideo
                })}>
                <Link to={`${trackPath}/${video.slug}`}>{video.title}</Link>
              </li>
            );
          })}
      </ul>
    );
  }
);

export default memo(OverviewTimeline);
