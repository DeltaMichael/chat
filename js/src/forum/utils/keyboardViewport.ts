export function installKeyboardViewport(page: HTMLElement, isNarrow: () => boolean): () => void {
  const viewport = window.visualViewport;
  const clear = () => {
    page.classList.remove('ChatPage--keyboard');
    page.style.removeProperty('--chat-keyboard-height');
  };
  const update = () => {
    const focused = document.activeElement;
    const composing = focused instanceof HTMLElement && focused.matches('.ChatComposer-input') && page.contains(focused);

    if (!viewport || !isNarrow() || !composing || viewport.scale > 1.01) {
      clear();
      return;
    }

    if (window.scrollY > 0) window.scrollTo(window.scrollX, 0);

    const available = viewport.offsetTop + viewport.height - page.getBoundingClientRect().top;
    page.style.setProperty('--chat-keyboard-height', `${Math.max(0, available)}px`);
    page.classList.add('ChatPage--keyboard');
  };

  page.addEventListener('focusin', update);
  page.addEventListener('focusout', clear);
  viewport?.addEventListener('resize', update);
  viewport?.addEventListener('scroll', update);
  window.addEventListener('resize', update);

  return () => {
    page.removeEventListener('focusin', update);
    page.removeEventListener('focusout', clear);
    viewport?.removeEventListener('resize', update);
    viewport?.removeEventListener('scroll', update);
    window.removeEventListener('resize', update);
    clear();
  };
}
