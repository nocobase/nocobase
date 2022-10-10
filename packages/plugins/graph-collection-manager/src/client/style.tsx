import { css } from '@emotion/css';



export const nodeSubtreeClass = css`
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
`;

export const addButtonClass = css`
  flex-shrink: 0;
  padding: 2em 0;
`;

export const  entityContainer=css`
    width: 200px;
    height: 100%;
    // min-height:150px;
    border-radius: 2px;
    background-color: white;
    .body {
        width:100%;
        height: 100%;
        background-color:#EFF4FF;
        overflow: auto;
        cursor: pointer;
        display: inline-table;

        border: 1px solid #5F95FF;
        .body-item {
          width: 100%;
          max-width:198px;
          height: 28px;
          font-size: 12px;
          color: #595959;
          height:25px;
          border-bottom: 1px solid #5F95FF;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;

          .field-operator {
            display: none;
          }
          &:hover {
            .field-operator {
              display: flex;
              flex-direction: row-reverse;
              position: absolute;
              width: 100%;
              height: 25px;
              line-height: 25px;
              left: 0px;
              // background: rgba(59, 60, 61, 0.5);
              z-index: 999;
              cursor: pointer;
              text-align: right;
              span {
                margin: 3px 5px 0;
                font-size: 18px;
                color: #ffffffd9;
              }
              span:hover {
                color:#fff
              }
            }
          }
  
          .name {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            margin-left: 6px;
  
            .pk,
            .fk {
              width: 12px;
              font-family: HelveticaNeue-CondensedBold;
              color: #ffd666;
              margin-right: 6px;
            }
          }
  
          .type {
            color: #bfbfbf;
            font-size: 8px;
            margin-right: 8px;
          }
        }
      }
`

export const headClass=css`
    height: 20px;
    font-size: 12px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background: #5F95FF;
    color: #fff;
    padding: 0 8px;
`

export const tableNameClass=css`
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const tableBtnClass=css`
  display:flex;
  span{
    margin-right: 5px;
    cursor: pointer;
  }
`