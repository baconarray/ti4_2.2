import {html} from "npm:htl";

// "All · None" links for a checkbox input. Setting .value alone doesn't notify Framework,
// so we dispatch an input event to make Generators.input pick up the change.
export function allNone(input, values) {
  const set = (v) => { input.value = v; input.dispatchEvent(new Event("input", {bubbles: true})); };
  return html`<div class="filter-actions">
    <button type="button" onclick=${() => set(values)}>All</button>
    <span>·</span>
    <button type="button" onclick=${() => set([])}>None</button>
  </div>`;
}
