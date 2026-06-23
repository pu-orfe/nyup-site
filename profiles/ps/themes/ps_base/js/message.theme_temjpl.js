/**
 * @file
 * Message template overrides.
 *
 * Overriding core's message functions to change classes to match what
 * ps_base expects for styling. This was only needed after upgrading to
 * Drupal 10.3, when front-end status messages are now rendered without
 * using the status-messages.html.twig template and instead are built directly
 * with JS. This is a bug in core that should hopefully be solved and bring
 * back messages styling from Drupal's render system.
 * @see https://www.drupal.org/project/drupal/issues/3456176.
 */

((Drupal) => {
  /**
   * Overrides message theme function to more closely match what
   * status-messages.html.twig is outputting.
   *
   * @param {object} message
   *   The message object.
   * @param {string} message.text
   *   The message text.
   * @param {object} options
   *   The message context.
   * @param {string} options.type
   *   The message type.
   * @param {string} options.id
   *   ID of the message, for reference.
   *
   * @return {HTMLElement}
   *   A DOM Node.
   */
  Drupal.theme.message = ({ text }, { type, id }) => {
    const messagesTypes = Drupal.Message.getMessageTypeLabels();
    const messageWrapper = document.createElement('div');

    messageWrapper.setAttribute('aria-label', messagesTypes[type]);
    messageWrapper.setAttribute('class', `alert alert-${type}`);

    messageWrapper.setAttribute(
      'role',
      type === 'error' || type === 'warning' ? 'alert' : 'status',
    );
    messageWrapper.setAttribute('data-drupal-message-id', id);
    messageWrapper.setAttribute('data-drupal-message-type', type);

    messageWrapper.setAttribute('aria-label', messagesTypes[type]);

    messageWrapper.innerHTML = `${text}`;

    return messageWrapper;
  };
})(Drupal);
