# Get Started

Subversion or git are nice, but if you just want to build the next great Web application, code generation is the answer. You can install the coherent Ruby gem and start right away.

    sudo gem install coherent

This will automatically install the distil gem as a dependency. First you should probably generate the gallery demo. Type the following in a folder where you keep your projects:

    coherent demo gallery sample
    
This will generate a fully functional miniature photo gallery. Granted, you'll have to look at photos of my daughter, but it's worth it since she's so cute.

Now you can build your application by running `distil`. Distil checks out the source for Coherent from github.com into a private library cache folder (usually in `~/.distil`). Each time you run `distil`, you're copy of the library will be updated. So if you require a specific version, you'll want to specify that in the `Buildfile`.

To see the result of all this _hard_ work, launch your default browser and view the `index.html` file in the demo application by typing:

    distil launch
    
You should see a page similar to the following:

<div style="margin: 0 auto; width:336px;">
<img src="http://coherentjs.org/wordpress/wp-content/uploads/2009/12/CoherentSampleGallery.png" alt="" title="Coherent Sample Gallery" width="336" height="290">
</div>

## Building An App Skeleton

Chances are you won't be content to stare at pictures of my daughter all day long. You probably want to build your **own** project. Back up to your projects folder and type:

    coherent app first-app
    cd first-app
    distil

Just like the gallery demo, this will generate the app and build it. If you open the `build` folder in your browser, you won't see anything terribly exciting. But now you're ready to go.
