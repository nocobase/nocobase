## Common Issues and Solutions

### 1. Empty columns and cells in Excel templates disappear in rendered results

**Problem Description**: In Excel templates, if a cell has no content or styling, it may be removed during rendering, causing missing cells in the final document.

**Solutions**:

- **Fill background color**: Apply a background color to empty cells in the target area to ensure cells remain visible during the rendering process.
- **Insert spaces**: Insert a space character in empty cells to maintain cell structure even without actual content.
- **Set borders**: Add border styles to the table to enhance cell boundaries and prevent cells from disappearing during rendering.

**Example**:

In the Excel template, set a light gray background for all target cells and insert spaces in empty cells.

### 2. Merged cells are invalid in output

**Problem Description**: When using loop functionality to output tables, merged cells in the template may cause abnormal rendering results, such as lost merge effects or data misalignment.

**Solutions**:

- **Avoid using merged cells**: Try to avoid using merged cells in loop output tables to ensure correct data rendering.
- **Use center across selection**: If you need text to be horizontally centered across multiple cells, use the "Center Across Selection" feature instead of merging cells.
- **Limit merged cell positions**: If merged cells are necessary, only merge cells above or to the right of the table, avoiding merging cells below or to the left to prevent loss of merge effects during rendering.



### 3. Content below loop rendering area causes format disorder

**Problem Description**: In Excel templates, if there is other content (e.g., order summary, notes) below a loop area that dynamically grows based on data items (e.g., order details), during rendering, the loop-generated data rows will expand downward, directly overwriting or pushing down the static content below, causing format disorder and content overlap in the final document.

**Solutions**:

  * **Adjust layout, place loop area at the bottom**: This is the most recommended method. Place the table area that needs loop rendering at the bottom of the entire worksheet. Move all information originally below it (summary, signatures, etc.) to above the loop area. This way, loop data can freely expand downward without affecting any other elements.
  * **Reserve sufficient blank rows**: If content must be placed below the loop area, estimate the maximum number of rows the loop might generate and manually insert enough blank rows as a buffer between the loop area and content below. However, this method has risks - if actual data exceeds the estimated rows, the problem will reoccur.
  * **Use Word templates**: If layout requirements are complex and cannot be resolved by adjusting Excel structure, consider using Word documents as templates. Tables in Word automatically push content below when rows increase, without content overlap issues, making it more suitable for generating such dynamic documents.

**Example**:

**Wrong approach**: Placing "Order Summary" information immediately below the looping "Order Details" table.

![20250820080712](https://static-docs.nocobase.com/20250820080712.png)


**Correct approach 1 (Adjust layout)**: Move "Order Summary" information above the "Order Details" table, making the loop area the bottom element of the page.

![20250820082226](https://static-docs.nocobase.com/20250820082226.png)


**Correct approach 2 (Reserve blank rows)**: Reserve many blank rows between "Order Details" and "Order Summary" to ensure loop content has enough expansion space.

![20250820081510](https://static-docs.nocobase.com/20250820081510.png)


**Correct approach 3**: Use Word templates.






### 4. Error prompts appear during template rendering

**Problem Description**: During template rendering, the system displays error prompts, causing rendering failure.

**Possible Causes**:

- **Placeholder errors**: Placeholder names don't match dataset fields or have syntax errors.
- **Missing data**: Dataset lacks fields referenced in the template.
- **Improper formatter usage**: Formatter parameters are incorrect or unsupported formatting types.

**Solutions**:

- **Check placeholders**: Ensure placeholder names in the template match field names in the dataset and have correct syntax.
- **Validate dataset**: Confirm the dataset contains all fields referenced in the template with proper data formats.
- **Adjust formatters**: Check formatter usage methods, ensure parameters are correct, and use supported formatting types.

**Example**:

**Incorrect template**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Dataset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Missing totalAmount field
}
```

**Solution**: Add the `totalAmount` field to the dataset or remove the reference to `totalAmount` from the template.