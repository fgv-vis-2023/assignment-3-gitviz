
# GitViz: Visualizing GitHub repositories

## Our decisions

Given the nature of the dataset, one of the most intuitive ways of visualizing the data is by a scatter/bubble plot, ideal for analysis of the correlation between numerical variables.

In our case, we wanted to visualize how the amount of stars and forks of a repository correlate with one another mainly. And, therefore, we have used these variables as the x and y axis of our bubble plot. We have also wanted to explore more variables, and we made the bubble size represent a relation between the numbers of stars and forks, given by:

$$\text{radius} = \min \left( 30,\ \max \left( 3,\ \left( \sqrt{\dfrac{s}{s_{\text{max}}}} + \sqrt{\dfrac{f}{f_{\text{max}}}} \right)30 \right) \right), $$

where $s$ is the number of stars and $f$ is the number of forks.

We chose this expression because it shows up to be a good indicator of the popularity of a repository, and it is also a good way of representing the relation between the two variables. Furthermore, we added a histogram below the plot to show the distribution of the repositories by the date of creation. This way, we can see the time evolution of the data.

Having the exploration of the data as priority, we used many common interaction tools, such as highlighting and different types of filtering. The user can click a repository to visit its GitHub page or filter the data by language. It is also possible to simultaneously filter by date of creation using a brush selection in the histogram below.

The animation was mainly used to smooth the transition between the different filters.

We considered the option of filtering by multiple languages at once, but ultimately decided against it due to no valuable gain of insight and the added complexity of the interaction between the two plots. Briefly, our design philosophy was to keep the interface as simple and effective as possible.

## Our development process

Initially, the team had a virtual meeting to discuss the project and the different ideas that we had. We had already decided to use the GitHub repositories dataset, so we decided on the type of visualization that we wanted to create and started development on a shared session through Live Share. The initial version was achieved relatively quickly, with the drawback that the code was not very modular and we didn't know how to get started with the interaction.

After some research, we were able to deliver an MVP with the most basic aspects of the visualization covered, then we started to work on more complex features, which required some code refactoring. The trickiest part was the interaction between the two plots, which required a lot of debugging and testing. We also had to make some decisions regarding the design of the interface so as to avoid cluttering of multiple types of information.

At this point, the development was mostly asynchronous, with each member working on a different aspect of the project. We discussed which features needed to be implemented and assigned them to a team member based on a consensus. We estimate that each member spent roughly 15 hours in the development of the project.

## Our sources

Dataset: \
https://www.kaggle.com/datasets/joonasyoon/github-topics

Inspiration:
* https://www.gapminder.org/tools/
* https://d3-graph-gallery.com/

---
[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/CxFZefIP)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-718a45dd9cf7e7f842a935f5ebbe5719a5e09af4491e668f4dbf3b35d5cca122.svg)](https://classroom.github.com/online_ide?assignment_repo_id=10959651&assignment_repo_type=AssignmentRepo)
