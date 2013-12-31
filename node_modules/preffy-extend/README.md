# preffy-extend()

`preffy-extend` is based on the classic extend() method from jQuery, but allows for certain types to be preferred, and not replace others.

## Installation

This package is available on [npm][1] as: `preffy-extend`

``` sh
npm install preffy-extend
```

## Usage

**Syntax:** prefex **(** `preferred`, [`deep`], `target`, `object1`, [`objectN`] **)** 

*Extend one object with one or more others, returning the modified object.*

Keep in mind that the target object will be modified, and will be returned from prefex(). If you don't want to modify the target, set the target to an empty object (`{}`), and include the others after.

If a boolean true is specified as the second argument, extend performs a deep copy, recursively copying any objects it finds. Otherwise, the copy will share structure with the original object(s). Deep copies receive the same preferred array as the original.
Undefined properties are not copied. However, properties inherited from the object's prototype will be copied over.

### Arguments

* `preferred` *Array*
The listing of types to prefer (see below).
* `deep` *Boolean* (optional)  
If set, the merge becomes recursive (i.e. deep copy).
* `target`	*Object*  
The object to extend.
* `object1`	*Object*  
The object that will be merged into the first.
* `objectN` *Object* (Optional)  
More objects to merge into the first.

### Preferred types

The preferred array should be given like this: `['object','string']`. This means that properties of type `object` will replace anything (have weight of 1), type `string` replaces anything except for objects (weight 0), and anything else has weight -1. In other words, the weights are the index of the `typeof` in the array, reversed.

## Known limitations

* Arrays are treated the same as objects (because that's what JS `typeof` does)
* There's no way to set different types to have the same weight

Please report any others in the [issue tracker][2].

## Examples

```javascript
prefex(['number'],{a:1,b:2,c:3},{d:4,a:'a'}) // { a: 1, b: 2, c: 3, d: 4 }
prefex([''],{a:1,b:2,c:3},{d:4,a:'a'}) // { a: 'a', b: 2, c: 3, d: 4 }
prefex(['object','string'],true,{a:1,b:'b',c:{d:4,e:'e'}},{a:'a',b:2,c:{d:true,e:false}}) // { a: 'a', b: 'b', c: { d: true, e: 'e' } }
```

## Browser

The `index.js` file in `preffy-extend` can be included in client-side scripting as well with no problem. I simply recommend renaming it.

## License

`preffy-extend` is licensed under the [MIT License][3].

## Acknowledgements

Credit to the jQuery authors for creating the original.

jQuery version ported to Node.js by [Stefan Thomas][5] with contributions by [Jonathan Buchanan][6] and [Jordan Harband][7].

Extended by [Scimonster][4] to support preferential types.

[1]: https://npmjs.org/package/preffy-extend
[2]: http://opensource.org/licenses/MIT
[4]: https://github.com/Scimonster/preffy-extend/issues
[4]: https://github.com/Scimonster
[5]: https://github.com/justmoon
[6]: https://github.com/insin
[7]: https://github.com/ljharb