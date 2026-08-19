import React from 'react';
import { Story } from '../types/story';
import { StoryHeader } from '../components/story-detail/StoryHeader';
import { VolumeList } from '../components/story-detail/VolumeList';

interface StoryDetailViewProps {
  story: Story;
  onBack: () => void;
  onReadChapter: (chapterId: string) => void;
}

export const StoryDetailView: React.FC<StoryDetailViewProps> = ({
  story,
  onBack,
  onReadChapter,
}) => {
  return (
    <div className="max-w-5xl lg:max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Story Header */}
      <StoryHeader
        story={story}
        onBack={onBack}
        onStartReading={onReadChapter}
      />

      {/* Volume & Chapter Listing with Search */}
      <VolumeList
        volumes={story.volumes}
        onSelectChapter={onReadChapter}
      />
    </div>
  );
};
