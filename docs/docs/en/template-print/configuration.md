## Configuration Instructions

### Activating Template Printing
Template printing currently supports detail blocks and table blocks. Below are the configuration methods for these two types of blocks.

#### Detail Blocks

1. **Open the Detail Block**:
- Navigate to the detail block in the application where you need to use the template printing feature.

2. **Access the Configuration Operation Menu**:
- Click the "Configuration Operation" menu at the top of the interface.

3. **Select "Template Printing"**:
- Click the "Template Printing" option in the dropdown menu to activate the plugin.


![Activate Template Printing](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)


### Configuring Templates

1. **Access the Template Configuration Page**:
- In the configuration menu of the "Template Printing" button, select the "Template Configuration" option.


![Template Configuration Option](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)


2. **Add a New Template**:
- Click the "Add Template" button to enter the template addition page.


![Add Template Button](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)


3. **Fill in Template Information**:
- In the template form, fill in the template name and select the template type (Word, Excel, PowerPoint).
- Upload the corresponding template file (supports `.docx`, `.xlsx`, `.pptx` formats).


![Configure Template Name and File](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)


4. **Edit and Save the Template**:
- Go to the "Field List" page, copy fields, and fill them into the template.
  
![Field List](https://static-docs.nocobase.com/20250107141010.png)

  
![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)

- After filling in the details, click the "Save" button to complete the template addition.

5. **Template Management**:
- Click the "Use" button on the right side of the template list to activate the template.
- Click the "Edit" button to modify the template name or replace the template file.
- Click the "Download" button to download the configured template file.
- Click the "Delete" button to remove unnecessary templates. The system will prompt for confirmation to avoid accidental deletion.
  
![Template Management](https://static-docs.nocobase.com/20250107140436.png)


#### Table Blocks

The usage of table blocks is basically the same as detail blocks, with the following differences:

1. **Support for Multiple Record Printing**: You need to first select the records to print by checking them. You can print up to 100 records at once.
   

![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)


2. **Template Isolation Management**: Templates for table blocks and detail blocks are not interchangeable — because the data structures are different (one is an object, the other is an array).