import { css } from 'styled-components';

export default css`
  .ui.card .description {
    word-wrap: break-word;
    word-break: break-word;
  }

  /* Ovverrides Semantic UI for the details page.*/
  .ui.items > .item:first-child {
    margin: 1em 0;
  }

  .center-content {
    justify-content: center;
  }

  .bold {
    font-weight: 700;
  }

  .details-param {
    display: flex;
  }

  .ui.tabular.list-menu {
    margin-bottom: 2rem;
  }
`;
