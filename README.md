# USWDS Elements

> [!CAUTION]
> Work on the next version of the U.S. Web Design System happens in this repo. At the moment, much of the code here is exploratory only, and in an extremely pre-alpha stage, though a few items have [graduated to alpha](https://github.com/uswds/uswds-elements/blob/develop/storybook/contributing.mdx#publishing-and-releases). APIs *will* change.


We've been slowly and incrementally building the next version of the Design System. This version will introduce modular [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)-based implmentations of Design System elements. We intend that, as we ship new USWDS Elements versions of existing USWDS components, you'll be able to use them alongside older versions of USWDS.

## Guiding principles

Work in this repo (along with all other USWDS code and design) adheres with the Design System's existing [Product values](https://designsystem.digital.gov/about/product-values/) and [Engineering values](https://github.com/uswds/uswds-proposals/blob/main/docs/engineering-values.md). Some of these have also driven foundational decisions for USWDS Elements, which we document in our [architectural decision records](https://github.com/uswds/uswds-proposals/tree/main/decisions). 

## What are some questions we're hoping to answer throughout the development process?

While this new version is meant to facilitate incremental adoption, these new components themselves represent a big shift in the technologies underlying previous versions of USWDS, which requires answering some fundamental questions. Some of the questions we're exploring in this work are:

- **What's the sweet spot for tooling?** If one of our goals is to minimize dependencies, how little tooling can USWDS get away with while still being easy for developers to use?
- **How should components enable customization?** How much content should come into components through attributes/props as opposed to slots? How much should components use shadow DOM vs. light DOM? Should components be styled through [custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) in the components themselves or through external stylesheets? If the answer's a mixture of both, what's the right balance between the two approaches?
- **How can we be sure the new components are as accessible as possible?** Existing USWDS components [use JavaScript to progressively enhance semantic HTML](https://designsystem.digital.gov/documentation/developers/) to make them usable to as much of the public as possible. Because web components require JavaScript by default, developing USWDS Elements requires special attention to continuing our progressive enhancement approach.

This isn't an exhaustive list, and we expect many more big and small questions to arise over the course of developing USWDS Elements. More to come, hopefully, as we work.

## Support / development speed
A final note here: USWDS staffing has fluctuated recently, which has made our forward development and support availability difficult to predict. To this point, the team has been able to say "we," but realistically "I" is now more accurate (hi, hello: this is Anne. nice to meet you if I haven't, and thanks for being here. one-person team here at USWDS at the moment).
