export function debounce(fn, wait) {
  let timeout;
  function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  }

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
}

