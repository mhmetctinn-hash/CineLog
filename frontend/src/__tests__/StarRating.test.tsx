import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../components/StarRating';

describe('StarRating', () => {
  it('shows the numeric rating on a 0-10 scale as stars/2', () => {
    render(<StarRating value={7} readOnly />);
    expect(screen.getByText('3.5')).toBeInTheDocument();
  });

  it('renders nothing numeric when value is null', () => {
    render(<StarRating value={null} readOnly />);
    expect(screen.queryByText(/\d\.\d/)).not.toBeInTheDocument();
  });

  it('calls onChange with a value on the 1-10 scale when a full star is clicked', () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);

    // third star, right (full) half -> 3 stars * 2 = 6
    const thirdStarFullHalf = screen.getByLabelText('3 yıldız');
    fireEvent.click(thirdStarFullHalf);

    expect(onChange).toHaveBeenCalledWith(6);
  });

  it('calls onChange with a half-star value when the left half is clicked', () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);

    const secondStarHalf = screen.getByLabelText('1.5 yıldız');
    fireEvent.click(secondStarHalf);

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange when readOnly', () => {
    const onChange = vi.fn();
    render(<StarRating value={4} onChange={onChange} readOnly />);

    expect(screen.queryByLabelText('3 yıldız')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
