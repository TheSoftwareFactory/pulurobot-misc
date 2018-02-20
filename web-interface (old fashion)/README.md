# Web Interface

This is an updated version of the prototype web interface which can be found at http://ojabotti.ha.fi:23456/
It's redesigned on a scalable purpose and wrapped in module/classes.

Here is a short description of the files and directories : 

* **assets/** : All the bootstrap template is there. _template.html_ is a an example page containing all pretty much all of what the template can offer
* **css/** : The css added by one of us which isn't part of a template from elsewhere
* **images/** : All of the images required by the interface.
* **js/** : The core js of the interface
    - **util.js** : with some tools not really related to this specific use (feel free to take the few lines of code for other projects)
    - **robotmap.js** : with all the stuff used to display the map of the robot and the robot himself
    - **no_use_found_code.js** : which contains all the code with no effect on the page (probably old code not yet removed)
    - **controller.js** : which is probably the most interesting as it wraps the socket, handle and parse the reception of all the message from the robot and sends orders to the robot
    - **main-es6.js** : behave like a "main" has to do : use the highest level of the API, expose the bindings with the page and create a controller and viewer for the robot (

## To keep things tidy

* I choose camelCase naming because it's the commonly used way to write in javascript. It's probably best to stick to it
* The only file that exposes variables is main-es6.js. The rest only expose classes, modules or constants. It makes thing easier to catch
* Expose only what you want to bind to the page.

## Possible things for tests :
If for some reason you want to change the url while running, you can just write in the console this:

    robotController.endConnection()
    robotController.url = myNewUrl
    robotController.startConnection()

it will do the trick.

You can have multiple maps in the same page (and multiple robot controllers).
But in the current state of implementation the four button for robot moves are shared by all the instance of the map.
To create a map, put an anchor in the index.html file as `<div id="id_of_my_map"></div>` and then write `let myMap = new RobotMap("id_of_my_map")` in a script.
You can also add options when creating the map, unleasted in the **robotmap.js** file. None of them are required and the default option is perfectly fine.
