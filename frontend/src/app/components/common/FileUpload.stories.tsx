// FileUpload.stories.tsx
import FileUpload from './FileUpload';
import type { Meta, StoryObj } from '@storybook/react';

// For Storybook 7.0+ with TypeScript
const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FileUpload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    onUploadSuccess: (report) => console.log('Uploaded:', report),
    maxSizeMB: 5,
  },
};