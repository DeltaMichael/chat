export function isChannelDisplayed(channelId: number, root: ParentNode = document): boolean {
  return Array.from(root.querySelectorAll<HTMLElement>('.ChatChannel[data-channel-id]')).some(
    (element) => element.dataset.channelId === String(channelId) && element.getClientRects().length > 0
  );
}
