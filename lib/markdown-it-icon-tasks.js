/**
 * Custom markdown-it plugin to render task list items with Bootstrap icons
 *
 * Syntax mapping:
 * - [#] -> bi-circle (unchecked)
 * - [#x] -> bi-check-circle-fill (checked)
 * - [@] -> bi-exclamation-circle (example for future extension)
 *
 * Easy to extend: Add more mappings in the iconMap object below
 */
export default function markdownItIconTasks(md, options = {}) {
  // Default icon mappings - easily extensible
  const iconMap = options.iconMap || {
    '#': {
      unchecked: '<i class="bi bi-circle text-muted"></i>',
      checked: '<i class="bi bi-check-circle-fill text-success"></i>',
      className: 'task-list-item icon-task-item'
    },
    '@': {
      unchecked: '<i class="bi bi-exclamation-circle text-warning"></i>',
      checked: '<i class="bi bi-check-circle-fill text-warning"></i>',
      className: 'task-list-item icon-task-item icon-task-important'
    },
    '!': {
      unchecked: '<i class="bi bi-exclamation-triangle text-danger"></i>',
      checked: '<i class="bi bi-check-circle-fill text-danger"></i>',
      className: 'task-list-item icon-task-item icon-task-critical'
    }
  };

  // Process tokens before rendering
  md.core.ruler.push('icon_tasks', function(state) {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'inline') continue;

      const inlineTokens = tokens[i].children;
      if (!inlineTokens) continue;

      // Look for list item parent by searching backwards
      let listItemToken = null;
      for (let k = i - 1; k >= 0; k--) {
        if (tokens[k].type === 'list_item_open') {
          listItemToken = tokens[k];
          break;
        }
        // Stop searching if we hit another list item close or leave the list
        if (tokens[k].type === 'list_item_close' || tokens[k].type === 'bullet_list_close' || tokens[k].type === 'ordered_list_close') {
          break;
        }
      }

      for (let j = 0; j < inlineTokens.length; j++) {
        const token = inlineTokens[j];

        if (token.type === 'text') {
          // Check each icon type
          for (const [iconChar, iconConfig] of Object.entries(iconMap)) {
            const uncheckedPattern = new RegExp(`^\\[${escapeRegex(iconChar)}\\]\\s`);
            const checkedPattern = new RegExp(`^\\[${escapeRegex(iconChar)}x\\]\\s`, 'i');

            let iconHtml = null;
            let matchLength = 0;

            if (checkedPattern.test(token.content)) {
              // Checked variant
              iconHtml = iconConfig.checked;
              matchLength = token.content.match(checkedPattern)[0].length;
            } else if (uncheckedPattern.test(token.content)) {
              // Unchecked variant
              iconHtml = iconConfig.unchecked;
              matchLength = token.content.match(uncheckedPattern)[0].length;
            }

            if (iconHtml) {
              // Create HTML inline token for the icon
              const htmlToken = new state.Token('html_inline', '', 0);
              htmlToken.content = iconHtml;

              // Update the text token to remove the marker
              token.content = token.content.slice(matchLength);

              // Insert the HTML token before the text token
              inlineTokens.splice(j, 0, htmlToken);
              j++; // Skip the newly inserted token

              // Set class on list item
              if (listItemToken) {
                const existingClass = listItemToken.attrGet('class') || '';
                const newClass = existingClass ? `${existingClass} ${iconConfig.className}` : iconConfig.className;
                listItemToken.attrSet('class', newClass);
              }

              break;
            }
          }
        }
      }
    }
  });
}

// Helper to escape special regex characters
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
