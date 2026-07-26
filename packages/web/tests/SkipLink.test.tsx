import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkipLink } from '@/components/SkipLink';

describe('SkipLink', () => {
  it('renders a link to main content', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('link is visually hidden by default', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    expect(link).toHaveStyle({ position: 'absolute' });
  });

  it('becomes visible on focus', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    fireEvent.focus(link);
    expect(link).toHaveStyle({ position: 'static' });
  });

  it('returns to hidden on blur', () => {
    render(<SkipLink />);
    const link = screen.getByText('Skip to main content');
    fireEvent.focus(link);
    fireEvent.blur(link);
    expect(link).toHaveStyle({ position: 'absolute' });
  });
});
