# Chapter 9: Task Dashboard & Charts

<iframe width="800" height="436" src="https://www.youtube.com/embed/qp-tWcyrzHM?si=ZtPJAHDYX-t2EpSh" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Dear friends, We’ve finally reached the long-awaited chapter on visualization! In this chapter, we’ll explore how to quickly zero in on the information we truly need amidst the clutter. As managers, we mustn’t lose our way in the complexity of tasks! Let’s tackle task statistics and information display together with ease.

### 9.1 Focus on Key Information

Our goal is to gain a quick overview of team tasks, highlighting those we are responsible for or interested in, without being overwhelmed by unnecessary data.

![](https://static-docs.nocobase.com/20241208170708.png)

Let’s start by creating a team task statistics [chart](https://docs.nocobase.com/handbook/data-visualization/user/chart-block).

#### 9.1.1 Create a [Chart Block](https://docs.nocobase.com/handbook/data-visualization/user/chart-block)

With a new page:

1. **Create a New Chart Data Block**.  (Within this main block, you can build multiple charts.)
2. **Select the Target Table:** Task Table. Then proceed to chart configuration.

![Steps Example](https://static-docs.nocobase.com/Solution/202411161926301731756390.png)
![Configuration Example](https://static-docs.nocobase.com/Solution/202411161928201731756500.png)

#### 9.1.2 Configure Task Status Statistics

If we want to count the number of tasks in different states, what should we do? First, we have to process the data:

- Measures: Choose a unique field, such as the ID field to count.
- Dimensions: Group data by **status**.

Next, Chart Configuration:

1. Select a [bar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/bar) or [column chart](https://docs.nocobase.com/handbook/data-visualization-echarts/column).
2. Set the **X field** to "Status" and the **Y field** to "ID."
   *(Tip: Remember to choose the "Status" in dimension fields for better visual distinction.)*

![](https://static-docs.nocobase.com/20241208172705.png)

#### 9.1.3 Multi-Dimensional Statistics: Tasks Per Person

Want to view task counts per person and their statuses? Use dual dimensions by adding the "Assignee/Nickname" dimension.

1. Click "Run Query" in the top-left corner.

![](https://static-docs.nocobase.com/20241208172811.png)

2. If the result isn't what you expected, select **"isGroup"** to display a comparative breakdown of tasks by assignees.

![](https://static-docs.nocobase.com/20241208172901.png)

3. Meanwhile, if you want to display the overall number of stacked, you can choose “isStack”. In this way, we can see the percentage of tasks for each person + the overall task status!

![](https://static-docs.nocobase.com/20241208172933.png)

### 9.2 Data Filtering and Dynamic Display

#### 9.2.1 Configure Data Filters

Of course, we can further remove the “Canceled” and “Archived” data, just remove these two options in the left filter conditions, I believe you are very familiar with these conditions!

![](https://static-docs.nocobase.com/20241208173025.png)

Once filtered, click confirm, exit configuration, and your first chart is ready!

#### 9.2.2 [Duplicate Charts](https://docs.nocobase.com/handbook/data-visualization/user/chart-block#configure-block-operations)

Need both **"isGroup"** and **"isStack"** charts without starting from scratch? Duplicate your chart:

- Click the copy icon on the top-right of your first chart block.
- Slide the wheel down, the second chart has appeared, drag and drop it to the right, remove the “isStack” configuration, change to “isGroup”.

![](https://static-docs.nocobase.com/Solution/202411161947481731757668.png)

#### 9.2.3 Dynamic [Filtering](https://docs.nocobase.com/handbook/data-visualization/user/filter)

For interactive [filtering](https://docs.nocobase.com/handbook/data-visualization/user/filter) of task data:

Of Course! We open "Filter" below the chart data block, and the filter box has appeared above. We show the desired fields and set the filtering conditions for the fields. (For example, change the date field to "between")

![Filter Example](https://static-docs.nocobase.com/Solution/202411161948261731757706.png)

![](https://static-docs.nocobase.com/Solution/202411161951261731757886.png)

![](https://static-docs.nocobase.com/Solution/202411161952281731757948.png)

#### 9.2.4 Creating Custom Filter Fields

What if we also want to include “Canceled” and “Archived” data in special cases, and support dynamic filtering and set filtering defaults?

Let's create a [customized filter field](https://docs.nocobase.com/handbook/data-visualization/user/filter#custom-fields)!

> You can easily configure filters by selecting fields from associated data tables or creating custom fields.(Only available within chart block)
>
> Options include editing field titles, descriptions, operators, and setting default values (e.g., the current user or date), making filters more tailored to your needs.

1. fill in the title of the “Status”.
2. Leave the Source field blank.
3. Select “Checkbox” for the component.
4. Options are filled in according to the value of the Status attribute when the database is created (note that the order of attributes here is Option Label - Option Value).

![](https://static-docs.nocobase.com/Solution/202411161958151731758295.png)

Create successfully, click “Set Default Value”, select the option we need.

![](https://static-docs.nocobase.com/Solution/202411162000141731758414.png)

![202411162000481731758448.png](https://static-docs.nocobase.com/Solution/202411162000481731758448.png)

After setting the default value, go back to the chart configuration, change the filter condition to “Status - is any of -  Current filters / status”, and then confirm! (Both charts should be changed.)

![](https://static-docs.nocobase.com/Solution/202411162001431731758503.png)

Done, let's filter test, the data has been perfectly rendered.

![202411162003151731758595.png](https://static-docs.nocobase.com/Solution/202411162003151731758595.png)

### 9.3 Dynamic Links and Task Filtering

A powerful feature: clicking on a statistic to jump to filtered tasks. Let’s make it happen.

#### 9.3.1 Using the "Not started" Example, Create a [Statistical Chart](https://docs.nocobase.com/handbook/data-visualization/antd/statistic)

1. Set the Measures to **ID - Count**.
2. Add a filter: Status = "Not Started"
3. Set container name to "Not Started", Chart Type to "Statistic", and leave chart name blank.

![](https://static-docs.nocobase.com/Solution/202411162011451731759105.png)

The unstarted stats have been successfully displayed. Let's make five copies by state and drag them to the top.

![](https://static-docs.nocobase.com/Solution/202411162017471731759467.png)

#### 9.3.2 Configure Link Filtering

1. Go back to the page containing the task management table block and observe the link format in the browser's address bar (usually something like `http://xxxxxxxxx/admin/0z9e0um1vcn`).
   ![](https://static-docs.nocobase.com/Solution/202411162046301731761190.png)

   Assume `xxxxxxxxx` represents your website domain, and `/admin/0z9e0um1vcn` is the path. (We only need to find the last `/admin`.)
2. Copy part of the link:

   - We need to perform a link jump. To do this, we first extract a specific portion of the link.
   - Copy from the text after `admin/` (excluding `admin/`) to the end of the link. For example, in this case, the portion to copy is: `0z9e0um1vcn`.
     ![](https://static-docs.nocobase.com/Solution/202411162048571731761337.png)

Move the cursor over "Not Started," and you’ll notice the cursor changes to a hand icon. Click on it to jump successfully.

![](https://static-docs.nocobase.com/241207gif_click_filter.gif)

3. Configure the chart link:Now, let’s add a filter parameter to the link. Do you remember the database identifier for task status? We’ll need to append this parameter to the end of the link to further filter tasks.
   - Add `?task_status=Not started` to the end of the link. Your link will then look like: `0z9e0um1vcn?task_status=Not started`.
     ![](https://static-docs.nocobase.com/Solution/202411162106351731762395.png)

> **Understanding URL Parameters:** When adding parameters to a URL, there are formatting rules to follow:
>
> - **Question mark (?):** Indicates the start of the parameters.
> - **Parameter name and value:** Format as `parameter_name=parameter_value`.
> - **Multiple parameters:** Use the `&` symbol to connect them. For example:
>   `http://xxxxxxxxx/admin/hliu6s5tp9x?status=todo&user=123`.
>   In this example, `user` is another parameter name, and `123` is its corresponding value.

4. Go back to the page, click to jump, and you’ll find the desired parameters are now included in the URL.  （Like `http://xxxxxxxxx/admin/0z9e0um1vcn` normally）

![](https://static-docs.nocobase.com/Pasted%20image%2020241207124358.png)

#### 9.3.3 [Associating URL Filter Conditions](https://docs.nocobase.com/handbook/ui/variables#url-search-params)

Why hasn't the table changed yet? Don't worry, let's finish the last step together!

- Go back to the form block configuration and click on “Set data range”.
- Select “Status” equal to “URL search params / status”.

Click on “Confirm” and the filtering is successful!

![f8c9b2d7f64cf1da4daaa80497235f92.png](https://static-docs.nocobase.com/f8c9b2d7f64cf1da4daaa80497235f92.png)
![](https://static-docs.nocobase.com/Pasted%20image%2020241207124401.png)

![](https://static-docs.nocobase.com/20241207124814.png)

![](https://static-docs.nocobase.com/20241207124914.png)

### 9.4 [Data Visualization](https://docs.nocobase.com/handbook/data-visualization): Stunning Charts

> **Data Visualization: [ECharts](https://docs.nocobase.com/handbook/data-visualization-echarts) (Commercial Plugin)**
> ECharts offers more advanced and customizable configuration options, such as "[Line Chart](https://docs.nocobase.com/handbook/data-visualization-echarts/line) (Multi-Dimension)," "[Radar Chart](https://docs.nocobase.com/handbook/data-visualization-echarts/radar)," "[Word Cloud](https://docs.nocobase.com/handbook/data-visualization-echarts/wordcloud)," and more.

If you want to access more chart configuration options, you can enable "Data Visualization: ECharts"!

#### 9.4.1 Quickly Configure a Stunning [Radar Chart](https://docs.nocobase.com/handbook/data-visualization-echarts/radar)

![](https://static-docs.nocobase.com/Solution/202411162116541731763014.png)

If you notice data overlap, remember to adjust the size or radius to ensure that all information is clearly displayed!

![](https://static-docs.nocobase.com/Solution/202411162119541731763194.png)

![202411162121201731763280.png](https://static-docs.nocobase.com/Solution/202411162121201731763280.png)

After configuration, simply drag and adjust the display style to complete!

![](https://static-docs.nocobase.com/Solution/202411162124151731763455.png)

#### 9.4.2 More chart containers

Here are more charts for you to explore.

##### [Word Cloud](https://docs.nocobase.com/handbook/data-visualization-echarts/wordcloud)

![](https://static-docs.nocobase.com/20241207125043.png)

##### [Funnel](https://docs.nocobase.com/handbook/data-visualization-echarts/funnel)

![](https://static-docs.nocobase.com/Solution/202411162130021731763802.png)

##### [Multiple Indicators (Dual Axes, Echarts Line)](https://docs.nocobase.com/handbook/data-visualization/antd-charts/dual-axes)

For bi-axial charts you can add more indicators

![](https://static-docs.nocobase.com/Solution/202411162133541731764034.png)

##### [Diverging bar](https://docs-cn.nocobase.com/handbook/data-visualization-echarts/diverging-bar)

![](https://static-docs.nocobase.com/Solution/202411162136401731764200.png)

### 9.5 Mini Challenge

1. Configure URL parameters for the remaining statuses: "In Progress," "Pending Review," "Completed," "Canceled," and "Archived."
2. Set up a "Assignee" multi-select field, just like the "Status" field, with a default value of the current user’s nickname.

Looking forward to seeing you in the [next chapter](https://www.nocobase.com/en/tutorials/project-tutorial-task-dashboard-part-2)!

---

Keep exploring and creating endless possibilities! If you encounter any issues along the way, don’t forget to check the [NocoBase Documentation](https://docs.nocobase.com/) or join the [NocoBase Community](https://forum.nocobase.com/) for discussions and support.
