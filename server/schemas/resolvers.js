const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).select(
          "-__v -password"
        );
        return userData;
      }
      throw new AuthenticationError("Not logged in");
    },
  },
  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }
      const token = signToken(user);
      return { token, user };
    },
    // accepts username, email, and password as parameters; returns Auth type
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);
      return { token, user };
    },
    // accepts a book author's array, description, title, bookId, image, and link as parameters; returns a User type
    saveBook: async (
      parent,
      { authors, description, title, bookId, image, link },
      context
    ) => {
      const user = await User.findOneAndUpdate(
        { _id: context.user._id },
        {
          $addToSet: {
            savedBooks: { authors, description, title, bookId, image, link },
          },
        },
        { new: true, runValidators: true }
      );
      return user;
    },
    // accepts a book's bookId as a parameter; returns a User type
    removeBook: async (parent, { bookId }, context) => {
      const user = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
      return user;
    },
  },
};

module.exports = resolvers;
