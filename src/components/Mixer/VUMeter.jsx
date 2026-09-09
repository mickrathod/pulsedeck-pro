import React from 'react';

export const VUMeter = ({ levelA = 0, levelB = 0 }) => {
  const totalSegments = 12;

  const renderColumn = (level) => {
    const activeCount = Math.round(level * totalSegments);
    return (
      <div className="vu-column">
        {Array.from({ length: totalSegments }).map((_, i) => {
          // Hardware ladder: index 0 is top (Red), index 11 is bottom (Green)
          const indexFromBottom = totalSegments - 1 - i;
          const isLit = indexFromBottom < activeCount;
          let colorClass = 'vu-green';
          if (i < 2) colorClass = 'vu-red';
          else if (i < 5) colorClass = 'vu-yellow';

          return (
            <span
              key={i}
              className={`${colorClass} ${isLit ? 'lit' : ''}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="meter-strip">
      <span className="meter-title">CH 1</span>
      <div className="vu-tower">
        {renderColumn(levelA)}
        {renderColumn(levelA * 0.95)}
        {renderColumn(levelB)}
        {renderColumn(levelB * 0.95)}
      </div>
      <span className="meter-title">CH 2</span>
    </div>
  );
};
