import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => {
  return {
    nbBord: css`
      .react-kanban-board {
        height: 100%;
        // padding: 5px;
        // margin-bottom: 24px;
      }

      .react-kanban-card {
        box-sizing: border-box;
        max-width: 250px;
        min-width: 250px;
        border-radius: 3px;
        background-color: #fff;
        padding: 10px;
        margin-bottom: 7px;
      }

      .react-kanban-card-skeleton {
        box-sizing: border-box;
        max-width: 300px;
        min-width: 300px;
        height: 70vh;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 0 12px;
        margin-bottom: 12px;
        > div {
          margin-bottom: 12px;
        }
        + div {
          display: none !important;
        }
      }

      .react-kanban-card--dragging {
        box-shadow: 2px 2px grey;
      }

      .react-kanban-card__description {
        padding-top: 10px;
      }

      .react-kanban-card__title {
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
      }

      .react-kanban-column {
        background-color: ${token.colorFillQuaternary};
        margin-right: 15px;
        padding-bottom: 15px;
        width: 300px;
      }

      .react-kanban-column-header {
        padding: 15px;
      }

      .react-kanban-card-adder-form {
        box-sizing: border-box;
        max-width: 250px;
        min-width: 250px;
        border-radius: 3px;
        background-color: #fff;
        padding: 10px;
        margin-bottom: 7px;
        input {
          border: 0px;
          font-family: inherit;
          font-size: inherit;
        }
      }

      .react-kanban-card-adder-button {
        width: 100%;
        margin-top: 5px;
        background-color: transparent;
        cursor: pointer;
        border: 1px solid #ccc;
        transition: 0.3s;
        border-radius: 3px;
        font-size: 20px;
        margin-bottom: 10px;
        font-weight: bold;
        &:hover {
          background-color: #ccc;
        }
      }

      .react-kanban-card-adder-form__title {
        font-weight: bold;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        width: 100%;
        padding: 0px;
        &:focus {
          outline: none;
        }
      }

      .react-kanban-card-adder-form__description {
        width: 100%;
        margin-top: 10px;
        &:focus {
          outline: none;
        }
      }

      .react-kanban-card-adder-form__button {
        background-color: #eee;
        border: none;
        padding: 5px;
        width: 45%;
        margin-top: 5px;
        border-radius: 3px;
        &:hover {
          transition: 0.3s;
          cursor: pointer;
          background-color: #ccc;
        }
      }

      .react-kanban-column-header {
      }

      .react-kanban-column-header__button {
        color: #333333;
        background-color: #ffffff;
        border-color: #cccccc;

        &:hover,
        &:focus,
        &:active {
          background-color: #e6e6e6;
        }
      }

      .react-kanban-column-adder-button {
        border: 2px dashed #eee;
        height: 132px;
        margin: 5px;

        &:hover {
          cursor: pointer;
        }
      }
    `,
    kanbanBoard: css`
      height: 100%;
    `,
  };
});
