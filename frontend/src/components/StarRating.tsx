interface StarRatingProps {
  /** 1-10 scale as stored by the API */
  value: number | null;
  onChange?: (value: number) => void;
  readOnly?: boolean;
}

export function StarRating({ value, onChange, readOnly }: StarRatingProps) {
  const stars = value ? value / 2 : 0;

  function handleClick(starIndex: number, half: boolean) {
    if (readOnly || !onChange) return;
    const newStars = half ? starIndex - 0.5 : starIndex;
    onChange(Math.round(newStars * 2));
  }

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(stars - (i - 1), 0), 1);
        return (
          <div key={i} className="relative w-6 h-6 cursor-pointer" aria-hidden={readOnly}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-border" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-highlight" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 w-1/2"
                  onClick={() => handleClick(i, true)}
                  aria-label={`${i - 0.5} yıldız`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 w-1/2"
                  onClick={() => handleClick(i, false)}
                  aria-label={`${i} yıldız`}
                />
              </>
            )}
          </div>
        );
      })}
      {value != null && <span className="ml-2 text-sm text-text-muted">{stars.toFixed(1)}</span>}
    </div>
  );
}
