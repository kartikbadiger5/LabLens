// FileUpload.test.tsx
import { describe, it, expect} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUpload from './FileUpload';
import '@testing-library/jest-dom';

describe('FileUpload', () => {
  it('renders upload area', () => {
    render(<FileUpload onUploadSuccess={() => {}} />);
    expect(screen.getByText(/drag and drop lab report pdf/i)).toBeInTheDocument();
  });

  it('shows error for invalid file type', async () => {
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    render(<FileUpload onUploadSuccess={() => {}} />);
    
    const input = screen.getByTestId('file-input');
    fireEvent.change(input, { target: { files: [file] } });
    
    await screen.findByText(/only pdf files are allowed/i);
  });
});