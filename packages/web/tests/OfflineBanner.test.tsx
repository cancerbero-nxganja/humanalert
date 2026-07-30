import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { OfflineBanner } from '@/components/OfflineBanner';

// The hook inside reads navigator.onLine; we control it via the mock in setup.ts
describe('OfflineBanner', () => {
  afterEach(() => {
    (navigator as { onLine: boolean }).onLine = true;
  });

  it('renders nothing when online', () => {
    (navigator as { onLine: boolean }).onLine = true;
    const { container } = render(<OfflineBanner language="en" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when offline', () => {
    (navigator as { onLine: boolean }).onLine = false;
    render(<OfflineBanner language="en" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('offline');
  });

  it('shows message in Spanish', () => {
    (navigator as { onLine: boolean }).onLine = false;
    render(<OfflineBanner language="es" />);
    expect(screen.getByRole('alert')).toHaveTextContent('desconectado');
  });

  it('shows message in Arabic', () => {
    (navigator as { onLine: boolean }).onLine = false;
    render(<OfflineBanner language="ar" />);
    expect(screen.getByRole('alert')).toHaveTextContent('غير متصل');
  });

  it('uses default English when no language prop is given', () => {
    (navigator as { onLine: boolean }).onLine = false;
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toHaveTextContent('offline');
  });

  it('falls back to English for unknown language code', () => {
    (navigator as { onLine: boolean }).onLine = false;
    render(<OfflineBanner language="xx" />);
    expect(screen.getByRole('alert')).toHaveTextContent('offline');
  });

  it('shows online→offline change via online event', async () => {
    (navigator as { onLine: boolean }).onLine = true;
    const { rerender } = render(<OfflineBanner language="en" />);
    expect(screen.queryByRole('alert')).toBeNull();

    (navigator as { onLine: boolean }).onLine = false;
    await act(async () => {
      window.dispatchEvent(new Event('offline'));
    });
    rerender(<OfflineBanner language="en" />);
    // After going offline component should show
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
