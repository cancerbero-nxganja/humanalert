import React from 'react';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
      }}
      onFocus={(e) => {
        (e.target as HTMLElement).style.cssText =
          'position:static;width:auto;height:auto;overflow:visible;';
      }}
      onBlur={(e) => {
        (e.target as HTMLElement).style.cssText =
          'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
      }}
    >
      Skip to main content
    </a>
  );
}
