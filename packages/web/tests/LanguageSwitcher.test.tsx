import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));
import { useRouter } from 'next/router';
const mockUseRouter = useRouter as jest.Mock;

const mockPush = jest.fn();

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({ locale: 'en', pathname: '/', asPath: '/', push: mockPush });
  });

  it('renders a select element with language options', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox', { name: 'Select language' });
    expect(select).toBeInTheDocument();
  });

  it('shows all 8 supported languages', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox');
    const options = select.querySelectorAll('option');
    expect(options.length).toBe(8);
  });

  it('has English selected by default', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });

  it('calls router.push with new locale on change', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'es' } });
    expect(mockPush).toHaveBeenCalledWith('/', '/', { locale: 'es' });
  });

  it('shows Arabic option', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('العربية')).toBeInTheDocument();
  });

  it('shows Chinese option', () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('falls back to en when router.locale is undefined', () => {
    mockUseRouter.mockReturnValueOnce({ locale: undefined, pathname: '/', asPath: '/', push: mockPush });
    render(<LanguageSwitcher />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('en');
  });
});
